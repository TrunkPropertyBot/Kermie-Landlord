/* 
Setup your aws account and create a credentials file:
$ mkdir ~/.aws # if it doesn't exist
$ cat <<'EOF' >> ~/.aws/credentials
[default]
aws_secret_access_key = "secret key"
aws_access_key_id = "your id"
EOF

Install aws module:
npm install aws-sdk

Execute the following script. Return contains:
Request {
...
{ Prediction: 
   { predictedLabel: '1',
     predictedScores: { '1': 0.5786105394363403 },
     details: { Algorithm: 'SGD', PredictiveModelType: 'BINARY' } } }
*/

var AWS = require('aws-sdk')
var creds = new AWS.Credentials(process.env.aws_access_key_id, process.env.aws_secret_access_key, null);
// var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = creds;
AWS.config.update({region: 'us-east-1'});
var machinelearning = new AWS.MachineLearning({apiVersion: '2014-12-12', region: "us-east-1"});

const predictRent = async(bedroom,bathroom,carspace,suburb,postcode) =>{
    let n_response;
    var params = {
        MLModelId: 'ml-wKvfv04HSkP', /* required */
        PredictEndpoint: 'https://realtime.machinelearning.us-east-1.amazonaws.com', /* required */
        Record: {
        "bedrooms": String(bedroom),
        "bathrooms": String(bathroom),
        "carspaces": String(carspace),
        "suburb": "melbourne",
        "postcode": String(postcode)
        }
      };

      n_response = await machinelearning.predict(params, function(err, data){
        if (err) console.log(err, err.stack); // an error occurred
        else { 
            result =  data.Prediction.predictedValue;
            console.log(n_response.response.data);
        }          // successful response
      });

    //  n_response = await machinelearning.predict(params);
    //   var result = await n_response.response.data;
    //   console.log(n_response.response.data);
      // result =  await response.data;
      // console.log('test ' + result);
      // console.dir(response, { depth: null });

      return result;
    }
  
    module.exports = {
        predictRent,
     }