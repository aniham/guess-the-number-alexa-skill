function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: 'PlainText',
      text: output,
    },
    card: {
      type: 'Simple',
      title: title,
      content: output,
    },
    reprompt: {
      outputSpeech: {
        type: 'PlainText',
        text: repromptText,
      },
    },
    shouldEndSession,
  };
}

function buildResponse(speechletResponse, sessionAttributes) {
  return {
    version: '1.0',
    sessionAttributes,
    response: speechletResponse,
  };
}

/**
 * on launch request
 */
function getWelcomeResponse(cb) {
  const speechOutput = `Hi welcome to guess the number! I am thinking of a number between 1 and 100.  You can guess what it is by saying, 10.  Or, is the number 25?`;
  const repromptText = 'Do you want to guess what number I am thinking of?';
  return cb(null, buildSpeechletResponse('Hello', speechOutput, repromptText, false));
}

/**
 * on AMAZON.HelpIntent
 */
function getHelpResponse(cb) {
  const speechOutput = 'In this game I make up a number between 1 and 100.  If you guess what number it is correctly, you win.  If you get it wrong, you can always try again!  You can try as many times as you want!';
  const repromptText = 'I am excited to play this game with you!';
  cb(null, buildSpeechletResponse('Help', speechOutput, repromptText, false));
}

/**
 * on AMAZON.FallbackIntent
 */
function getFallbackResponse(cb) {
  const speechOutput = 'I did not understand that!  Try telling what number you think I have in mind.  Or ask for help by saying help.';
  cb(null, buildSpeechletResponse('Wrong', speechOutput, null, false));
}

/**
 * on AMAZON.StopIntent, AMAZON.CancelIntent, AMAZON.CancelIntent
 */
function getGoodbyeResponse(cb) {
  const speechOutput = 'Thank you for guessing some numbers with me today!  Have a nice day!';
  cb(null, buildSpeechletResponse('Goodbye', speechOutput, null, true));
}

/**
 * on handleGuess
 */
function handleGuess(intent, number, cb) {
  console.log(`intent: ${JSON.stringify(intent)}`);
  let guessNumber = parseInt(intent.slots.number.value);
  if (guessNumber === number) {
    const speechOutput = `You guessed it!  Awesome job!  I was thinking of the number ${number}.  I really enjoyed playing with you!  I hope we play again soon!  Goodbye for now!`;
    return cb(null, buildSpeechletResponse('Guess', speechOutput, null, true));
  }
  let direction = number  > guessNumber ? 'higher' : 'lower';
  const speechOutput = `Close.  But the number I am thinking of is ${direction}.`;
  const repromptText = `Do you want to guess again?`;
  return cb(null, buildSpeechletResponse('Guess', speechOutput, repromptText, false));
}

function onIntent(intentRequest, session, number, cb) {
  const intent = intentRequest.intent;
  const intentName = intentRequest.intent.name;

//   console.log(`onIntent intent: ${JSON.stringify(intent)}, intentName: ${intentName}`);

  if (intentName === 'guess') {
    return handleGuess(intent, number, cb);
  } else if (intentName === 'AMAZON.HelpIntent') {
    return getHelpResponse(cb);
  } else if (intentName === 'AMAZON.FallbackIntent') {
    return getFallbackResponse(cb);
  } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.NoIntent') {
    return getGoodbyeResponse(cb);
  } else {
    throw new Error('Invalid intent');
  }
}

/**
 * entry point
 */
exports.handler = (event, context, cb) => {
  // console.log(`event: ${JSON.stringify(event)}`);

  // console.log(`session: ${JSON.stringify(event.session)}`);

  // either get the number alexa already picked or pick a new number
  let number;
  let sessionAttributes;
  if (event.session.new) {
    number = Math.floor(Math.random() * 100) + 1;
    sessionAttributes = {};
    sessionAttributes.number = number;
  } else {
    sessionAttributes = event.session.attributes;
    number = sessionAttributes.number;
  }

  if (event.request.type === 'LaunchRequest') {
    return getWelcomeResponse((err, speechletResponse) => {
      // TODO aniham handle error
      cb(null, buildResponse(speechletResponse, sessionAttributes));
    });
  } else if (event.request.type === 'IntentRequest') {
    onIntent(event.request,
      event.session,
      number,
      (err, speechletResponse) => {
        // TODO aniham handle error
        cb(null, buildResponse( speechletResponse, sessionAttributes));
      });
  } else if (event.request.type === 'SessionEndedRequest') {
    return cb();
  }
};

