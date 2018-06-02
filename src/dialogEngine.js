const priceFinder = require('./priceFinder');

const updateMessage = async (input, response) => {
  var responseText = null;

  var msg = await processIntents(input, response);
  if (msg != null) {
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
  switch (intent) {
    case 'imagetest':
      message = getImageTestMsg();
      break;
    case 'videotest':
      message = getVideoTestMsg();
      break;
  }

  switch (conversationNode) {
    case 'node_14_1527147231149':
    case 'node_1_1527765265584':
      let property = await priceFinder.suggestProperty(data.context.address);
      if (property.matches.length > 0) {
        data.context.currentContext = "addressFound";
        data.context.address = property.matches[0].display;
        data.context.propertyID = property.matches[0].property.id;
        Z_currentPropertyF = await priceFinder.getPropertyFeature(data.context.propertyID);
          let mainImage = await priceFinder.getPropertyImage(data.context.propertyID);
          if(mainImage != undefined){
            var defaultAppend = `?access_token=${process.env.PRICEFINDER_TOKEN}&height=400&width=400`;
            var imageFullUrl = mainImage + defaultAppend;
            data.context.holdMSG = await data.context.holdMSG + " It is at "+data.context.address+". Is this the one you are looking for?";
            message = data.context.holdMSG + '<img src=' + imageFullUrl + ' alt=' + data.context.address + '>';
          }else{
            message = data.context.holdMSG = await data.context.holdMSG + " It is at "+data.context.address+
            ". Is this the one you are looking for? I'm sorry but I could not find an image for this property";
          }
      } else {
        data.context.currentContext = "addressNotFound";
        message = "I'm sorry that I could not find a property at the address you given. Would you like to estimate the rent by the suburb instead?";
      }
      break;
    //
    // case 'node_9_1527129120120':
    //   let mainImage = await priceFinder.getPropertyImage(data.context.propertyID);
    //   var defaultAppend = `?access_token=${process.env.PRICEFINDER_TOKEN}&height=400&width=400`;
    //   var imageFullUrl = mainImage + defaultAppend;
    //   message = data.context.holdMSG + '<img src=' + imageFullUrl + ' alt=' + data.context.address + '>';
    //   break;

    case 'node_2_1526279319525':
      let suburb = await priceFinder.suggestSuburb(data.context.suburb);
      if (suburb.matches.length > 0) {
        data.context.currentContext = "suburbFound";
        data.context.suburbID = await suburb.matches[0].suburb.id;
        data.context.suburb = await suburb.matches[0].display;
        let rentSuburb = await priceFinder.suburbRent(data.context.suburbID);
        data.context.suburbRent = await rentSuburb.house.medianRentalPrice;
        message = "The estimated rent in " + data.context.suburb + " is roughly $" + data.context.suburbRent + " per week.";
      } else {
        data.context.currentContext = "suburbNotFound";
        message = "I can't find " +data.context.suburb+ " in my suburb list. I don't think it's a suburb, at least, not one I'm currently aware about. Please give me the suburb of the property again.";
      }
      break;

    case 'node_3_1527477230991':
      let rentSuburb = await priceFinder.suburbRent(data.context.suburbID);
      data.context.suburbRent = rentSuburb.house.medianRentalPrice;
      message = "The estimated rent in " + data.context.suburb + " is roughly $" + data.context.suburbRent + " per week.";
      break;

    case 'node_1_1527664935076':
    case 'node_1_1527769088378':
      switch (intent) {
        case 'bedrooms':
        if(Z_currentPropertyF.bedrooms != undefined){
            message = 'The property has ' + Z_currentPropertyF.bedrooms + ' bedrooms.';
        }else{
          message = 'There is no information on how many bedrooms this property has';
        }
          break;
        case 'bathrooms':
        if(Z_currentPropertyF.bathrooms != undefined){
            message = 'The property has ' + Z_currentPropertyF.bathrooms + ' bathrooms.';
        }else{
          message = 'There is no information on how many bathrooms this property has';
        }
          break;
        case 'carparking':
        if(Z_currentPropertyF.carParks != undefined){
            message = 'The property has ' + Z_currentPropertyF.carParks + ' carparks.';
        }else{
          message = 'There is no information on how many carparks this property has';
        }
          break;
      }
      break;
  }

  switch (conversationNode) {
    case 'node_1_1526963703574 ':
      let property = await priceFinder.suggestProperty(data.input.text);
      if (property.matches.length > 0) {
        message = "address found";
      } else {
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

  for (var i = 0; i < intentList.length; i++) {
    // get confidence of current intent we're looking at
    currConfidence = intentList[i].confidence;
    // if it's confidence 1, we don't need to bother looking
    // at any other intents returned, this is the one we want
    if (currConfidence == 1) {
      intent = intentList[i].intent;
      break;
    }
    // update highest confidence intent
    if (currConfidence > confidence) {
      intent = intentList[i].intent;
    }
  }
  return intent;
}

module.exports = {
  updateMessage,
}
