const Alexa = require('ask-sdk-core');
const provider = require('./provider');

const SKILL_TITLE = "Distintivo Ambiental";

function getTagType(tagTypeEnum) {
  switch (tagTypeEnum) {
    case 'NO_TAG': return 'Sin distintivo'
    case 'C_TAG': return 'Etiqueta C Verde'
    case 'B_TAG': return 'Etiqueta B Amarilla'
    case 'ZERO_TAG': return 'Etiqueta Cero'
    case 'ECO_TAG': return 'Etiqueta Eco'
    case 'UNKNOWN': return 'Desconocido'
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },

  async handle(handlerInput) {
      const speechText = 'Bienvenido a Distintivo Ambiental, esta skill te dirá que etiqueta de distintivo medioambiental tiene un coche. ' +
        'Para continuar di "consulta el distintivo de" seguido de la matricula que quiere consultar.';

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .withSimpleCard(SKILL_TITLE, speechText)
        .getResponse();
  
  }
};

const CarTagQueryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest"
      && handlerInput.requestEnvelope.request.intent.name === "CarTagQueryIntent"
  },

  async handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.dialogState !== 'COMPLETED') {
      return handlerInput.responseBuilder
        .addDelegateDirective()
        .getResponse();
    }

    const intent = handlerInput.requestEnvelope.request.intent;
    const carLicensePlate = intent.slots["carLicensePlate"].value;

    const tagTypeEnum = await provider.queryNumberPlateEnum(carLicensePlate);
    const tagType = getTagType(tagTypeEnum)

    var speechText;
    if (tagTypeEnum === 'NO_TAG') {
      speechText = `El coche con matricula <say-as interpret-as="spell-out">${carLicensePlate}</say-as> no tiene distintivo medioambiental`
    } else if (tagTypeEnum === 'UNKNOWN') {
      speechText = `No he podido consultar el distintivo de la matricula que me has indicado`
    } else {
      speechText = `El coche con matricula <say-as interpret-as="spell-out">${carLicensePlate}</say-as> tiene el distintivo ${tagType}`
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(tagType, speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Esta skill te permite consultar el distintivo ambiental que tiene un coche mediánte su matricula. ' +
      'Estos datos se envían directamente a la DGT, que es la que nos dice el distintivo que tiene el coche.' 

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = '¡Hasta luego!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(SKILL_TITLE, speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    console.log(`Session ended: ${handlerInput}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);

    const speechText = 'Ha ocurrido un error, por favor inténtalo otra vez';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

let skill;

exports.handler = async function (event, context) {
  console.log(`SKILL REQUEST ${JSON.stringify(event)}`);

  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        CarTagQueryIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`SKILL RESPONSE ${JSON.stringify(response)}`);

  return response;
};