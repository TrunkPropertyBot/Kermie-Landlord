const priceFinder = require('./priceFinder');
const rentEstimator = require('./predict');

const updateMessage = async (input, response) => {
  var responseText = null;
  var Z_currentPropertyF;
  var Z_cuurentAddress;

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
  if ( data.output.nodes_visited ) {
    conversationNode = data.output.nodes_visited[0];
  }
  var message = null;
  console.log(conversationNode);
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
    //dialog node:Look for property
    case 'node_2_1526965411734':
      let property = await priceFinder.suggestProperty(data.input.text);
      if( property.matches.length > 0) {
      var matchId = await property.matches[0].property.id;
      // let propertyDetail = await priceFinder
      Z_currentAddress = await property.matches[0].display;
      let mainImage = await priceFinder.getPropertyImage(matchId);
      Z_currentPropertyF = await priceFinder.getPropertyFeature(matchId);
      console.log(Z_currentPropertyF);

      console.log('image '+ mainImage);
      var defaltAppend = `?access_token=${process.env.PRICEFINDER_TOKEN}&height=400&width=400`;
      var imageFullUrl = mainImage+defaltAppend;
      // https://api.pricefinder.com.au/v1/images/220876438?access_token=17d97e9916dc788d8c9c29f78a793f7
      message ='<img src='+imageFullUrl+' alt='+Z_currentAddress+'>' + Z_currentAddress;
      }
      else{
        message = 'No property found for this address';
      }
      break;

    case 'node_1_1527404413999':
      switch(intent){
        case 'bedrooms':
        message = 'The property has '+Z_currentPropertyF.bedrooms+' bedrooms.';
        break;
        case 'bathrooms':
        message = 'The property has '+Z_currentPropertyF.bathrooms+' bathrooms.';
        break;
        case 'carparking':
        message = 'The property has '+Z_currentPropertyF.carParks+' carparks.';
        break;
      }
      break;

    // make appointment
    case 'node_5_1527429752421':
    message = 'Your appointment for '+ Z_currentAddress +' has been made!';
    break;
    
    case 'node_14_1527147231149':
    let house = await priceFinder.suggestProperty(data.input.text);
      if( house.matches.length > 0) {
        data.context.currentContext = 'addressFound';
        console.log(data.context.currentContext);
      }
      else{
        data.context.currentContext = 'addressNotFound';
      }
      break;

    case 'slot_28_1526280891346':
    var n_bedroom = 3;
    var n_bathroom =2;
    var n_carspace = 1;
    var n_postcode = 3000;
    var n_suburb = data.context.suburb;
    let price = await rentEstimator.predictRent(n_bedroom,n_bathroom,n_carspace,n_suburb,n_postcode);
    console.log('price: ')+price;
    break;
  }

  return message;
}

function getImageTestMsg() {
  var imageUrl = "https://vignette.wikia.nocookie.net/hmwikia/images/1/11/Cow_tott.jpg/revision/latest?cb=20160114034237";
  return '<img src='+imageUrl+' alt="Mountain View">';
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