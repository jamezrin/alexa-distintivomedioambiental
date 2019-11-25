const request = require('request-promise');
const cheerio = require('cheerio');

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36"

function makeResultRequest(numberPlate) {
    return request({
        url: "http://www.dgt.es/es/seguridad-vial/distintivo-ambiental/index.shtml",
        method: "GET",
        qs: {
            "accion": 1,
            "matriculahd": "",
            "matricula": numberPlate,
            "submit": "Comprobar"
        },
        headers: {
            "User-Agent": USER_AGENT
        }
    });
}

async function queryNumberPlate(numberPlate) {
    const queryResponse = await makeResultRequest(numberPlate);
    const $ = cheerio.load(queryResponse);
    const queryResult = $('#resultadoBusqueda').text().trim();
    return queryResult;
}

async function queryNumberPlateEnum(numberPlate) {
    const queryResult = await queryNumberPlate(numberPlate);

    if (queryResult.startsWith('Sin distintivo')) {
        return 'NO_TAG'
    } else if (queryResult.startsWith('Etiqueta Ambiental C')) {
        return 'C_TAG'
    } else if (queryResult.startsWith('Etiqueta Ambiental B')) {
        return 'B_TAG'
    } else if (queryResult.startsWith('Etiqueta Ambiental 0')) {
        return 'ZERO_TAG'
    } else if (queryResult.startsWith('Etiqueta Ambiental Eco')) {
        return 'ECO_TAG'
    } else {
        return 'UNKNOWN'
    }
}

module.exports = { queryNumberPlate, queryNumberPlateEnum }