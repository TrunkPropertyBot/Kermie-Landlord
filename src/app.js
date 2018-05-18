/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var watson = require('watson-developer-cloud'); // watson sdk

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var assistant = new watson.AssistantV1({
  // If unspecified here, the ASSISTANT_USERNAME and ASSISTANT_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: process.env.ASSISTANT_USERNAME || '<username>',
  password: process.env.ASSISTANT_PASSWORD || '<password>',
  version: '2018-02-16'
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the assistant service
  assistant.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }

    return res.json(updateMessage(payload, data));
  });
});

/*
*  Custom intent processing on the server
*/
function processIntents(payload, data) {
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
function getHighestConfidenceIntent(intentList) {
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

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
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

module.exports = app;
