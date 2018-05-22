const priceFinder = require('./priceFinder');

const updateMessage = (input, response) => {
  var responseText = null;

  var msg = processIntents(input, response);
  if(msg != null){
    response.output.text = msg;
    return response;
  }  

  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

const processIntents = (payload, data) => {
  var intent = getHighestConfidenceIntent(data['intents']);
  var message = null;

  // Switch over the various cases for handled intents
  switch(intent){
    case 'imagetest':
      message = getImageTestMsg();
      break;
    case 'videotest':
      message = getVideoTestMsg();
      break;
    case 'getproperty':

  }

  return message;
}

function getImageTestMsg() {
  return '<img src="https://vignette.wikia.nocookie.net/hmwikia/images/1/11/Cow_tott.jpg/revision/latest?cb=20160114034237" alt="Mountain View">';
}

function getVideoTestMsg() {
  return '<iframe width="100%" height="250px" src="https://www.youtube.com/embed/ryyPW754sJQ?rel=0&amp;showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
}

/*
  * Loop over all intents found by Watson and return the
  * intent we're most confident the user put forward
  */
const getHighestConfidenceIntent = (intentList) => {
  var confidence = 0;
  var currConfidence = 0;
  var intent = null;

  for(var i = 0; i < intentList.length; i++){
    // get confidence of current intent we're looking at
    currConfidence = intentList[i].confidence;
    // if it's confidence 1, we don't need to bother looking
    // at any other intents returned, this is the one we want
    if(currConfidence == 1){
      intent = intentList[i].intent;
      break;
    }
    // update highest confidence intent
    if(currConfidence > confidence){
      intent = intentList[i].intent;
    }
  }
  return intent;
}

module.exports = {
  updateMessage,
}