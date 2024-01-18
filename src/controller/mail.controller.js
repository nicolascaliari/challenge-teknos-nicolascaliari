const fs = require('fs');
const path = require('path');
const multer = require('multer');
const important = require('../json/important.json');
const db = require('../config/db');
const uuid = require('uuid');


let idMessage = '';



//Con json

// const findAll = (req, res) => {
//     try {
//         const folders = fs.readFileSync(path.join(__dirname, '../json/folders.json'), 'utf8');

//         const data = JSON.parse(folders);
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'No hay carpetas' });
//     }
// };



//con mysql
const findAll = (req, res) => {
    db.query('SELECT * FROM folders', (err, rows, fields) => {
        if (!err) {
            res.json(rows);
        } else {
            console.log(err);
            res.status(500).send('Error interno del servidor');
        }
    });
};

//----------con json----------------

// const filterMessages = (req, res) => {

//     const { from, to, subject, folder } = req.query;

//     const folders = fs.readFileSync(path.join(__dirname, `../json/${folder}.json`), 'utf8');

//     const folderParsed = JSON.parse(folders);

//     const data = folderParsed.data;

//     if (!data) {
//         res.status(404).json({ message: 'No hay mensajes' });
//         return;
//     }

//     if (from) {
//         const mensajesFiltrados = data.filter(mensaje => {
//             const fromData = mensaje.from;
//             return fromData.name.toLowerCase().includes(from.toLowerCase());
//         });
//         res.json({ mensajesFiltrados });
//         return;
//     }

//     if (to) {
//         const mensajesFiltrados = data.filter(mensaje => {
//             const toDataArray = mensaje.to;
//             return toDataArray[0].name.toLowerCase().includes(to.toLowerCase());
//         });
//         res.json({ mensajesFiltrados });
//         return;
//     }

//     if (subject) {
//         const mensajesFiltrados = data.filter(mensaje => {
//             return mensaje.subject.toLowerCase().includes(subject.toLowerCase());
//         });
//         res.json({ mensajesFiltrados });
//         return;
//     }


//     res.json({ data });
// };


// ----------------con mysql----------------
const filterMessages = (req, res) => {
    const { from, to, subject, folder } = req.query;


    if (folder === null || folder === undefined) {
        res.status(404).json({ message: 'Debes colocar un valor en folder' });
        return;
    }
    db.query(`SELECT * FROM ${folder}`, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error interno del servidor');
            return;
        }

        let messageFilter = rows;

        if (from) {
            messageFilter = rows.filter(message => {
                const fromData = JSON.parse(message.from_data);
                return fromData.name.toLowerCase().includes(from.toLowerCase());
            });
        }

        if (to) {
            messageFilter = rows.filter(message => {
                const toDataArray = JSON.parse(message.to_data);
                return toDataArray[0].name.toLowerCase().includes(to.toLowerCase());
            });
        }

        if (subject) {
            messageFilter = rows.filter(message => {
                return message.subject.toLowerCase().includes(subject.toLowerCase());
            });
        }

        const mensajesFiltradosObjetos = messageFilter.map(mensaje => ({
            ...mensaje,
            from_data: JSON.parse(mensaje.from_data),
            to_data: JSON.parse(mensaje.to_data),
            attachments: JSON.parse(mensaje.attachments),
        }));

        res.json(mensajesFiltradosObjetos);
    });
};




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads')
    },
    filename: (req, file, cb) => {
        idMessage = uuid.v4();
        cb(null, `${idMessage}-${file.originalname}`)
    }
});

const upload = multer({ storage: storage });

//-------------con json----------------
// const createMessage = (req, res) => {
//     const { dataJson} = req.body;
//     const { file } = req;
//     const { folder } = req.params;



//     const dataParseada = JSON.parse(dataJson);

//     const folders = fs.readFileSync(path.join(__dirname, `../json/${folder}.json`), 'utf8');

//     const folderParseada = JSON.parse(folders);

//     const data = folderParseada.data;

//     const formattedMessage = {
//         "id": idMessage,
//         "file": file ? file.path : null,
//         ...dataParseada
//     };

//     data.push(formattedMessage);
//     fs.writeFileSync(path.join(__dirname, `../json/${folder}.json`), JSON.stringify({ data }, null, 2));

//     res.json({ data });
// };



//-------------con mysql----------------

const createMessage = (req, res) => {

    const { dataJson } = req.body;
    const { file } = req;
    const { folder } = req.params;

    const newMessage = JSON.parse(dataJson);

    const fromString = JSON.stringify(newMessage.from);
    const toString = JSON.stringify(newMessage.to);
    const attachmentsString = JSON.stringify(newMessage.attachments);
    const labelsString = JSON.stringify(newMessage.labels);


    const sql = `INSERT INTO ${folder} 
                 (id, file, from_data, to_data, subject, message, time, message_read, starred, important, hasAttachments, attachments, labels) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
        sql,
        [
            idMessage,
            file.path,
            fromString,
            toString,
            newMessage.subject,
            newMessage.message,
            newMessage.time,
            newMessage.read,
            newMessage.starred,
            newMessage.important,
            newMessage.hasAttachments,
            attachmentsString,
            labelsString
        ],
        (error) => {
            if (error) {
                res.status(500).json({ error: 'Error interno del servidor' });
                console.error(error.message);
            } else {
                res.json({ newMessage });
            }
        }
    );

};




//-------------con json----------------

// const deleteMessage = (req, res) => {

//     const { id } = req.params;

//     const data = important.data;

//     const mensajeEncontrado = data.find(mensaje => mensaje.id === id);

//     if (!mensajeEncontrado) {
//         res.status(404).json({ message: 'Mensaje no encontrado' });
//         return;
//     }

//     const mensajeBorrado = data.filter(mensaje => mensaje.id !== id);

//     fs.writeFileSync(path.join(__dirname, '../json/important.json'), JSON.stringify({ data: mensajeBorrado }, null, 2));

//     res.json({ mensajeBorrado });

// };


//-------------con mysql----------------
const deleteMessage = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM important WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al borrar el mensaje:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
        } else {
            console.log('Mensaje borrado correctamente');
            res.json({ message: 'Mensaje borrado correctamente' });
        }
    });
};




module.exports = {
    findAll,
    filterMessages,
    createMessage,
    deleteMessage,
    upload
};
