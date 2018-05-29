const priceFinder = require('./priceFinder');

const updateMessage = async (input, response) => {
  var responseText = null;

  var msg = await processIntents(input, response);
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

const processIntents = async (payload, data) => {
  var intent = getHighestConfidenceIntent(data['intents']);
  let conversationNode = null;
  if (data.output.nodes_visited) {
    conversationNode = data.output.nodes_visited[0];
  }
  var message = null;

  // Switch over the various cases for handled intents
  switch(intent){
    case 'imagetest':
      message = getImageTestMsg();
      break;
    case 'videotest':
      message = getVideoTestMsg();
      break;
  }

  switch(conversationNode){
    case 'node_14_1527147231149':
      let property = await priceFinder.suggestProperty(data.context.address);
      if(property.matches.length > 0) {
        data.context.currentContext = "addressFound";
        data.context.address = property.matches[0].display;
      }
      else{
        data.context.currentContext = "addressNotFound";
      }
      break;
  }

  switch(conversationNode){
    case 'node_2_1526279319525':
    let suburb = await priceFinder.suggestSuburb(data.context.suburb);
      if(suburb.matches.length > 0) {
        data.context.currentContext = "suburbFound";
        data.context.suburbID = suburb.matches[0].suburb.id;
        data.context.suburb = suburb.matches[0].display;
      }
      else{
        data.context.currentContext = "suburbNotFound";
      }
      break;
  }

  switch(conversationNode){
          case 'node_3_1527477230991':
          let rentSuburb = await priceFinder.suburbRent(data.context.suburbID);
          message = "The estimated rent in " +data.context.suburb+ " is roughly " +rentSuburb.house.medianRentalPrice+" per week.";
          break;
  }

  switch(conversationNode){
    case 'node_1_1526963703574 ':
      let property = await priceFinder.suggestProperty(data.input.text);
      if(property.matches.length > 0) {
        message = "address found";
      }
      else{
        message = "address not found";
      }
      break;
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
