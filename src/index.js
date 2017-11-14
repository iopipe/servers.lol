import _ from 'lodash';
import AWS from 'aws-sdk';
import pSettle from 'p-settle';
import omitDeep from 'omit-deep';

const regions = [
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'sa-east-1',
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central'
];

async function getEnvironments(region) {
  const eb = new AWS.ElasticBeanstalk({ region });
  const res = await eb.describeEnvironments().promise();
  return _.chain(res)
    .get('Environments')
    .map('EnvironmentName')
    .map(envName => [envName, region])
    .value();
}

async function getEnvironmentMetrics(arr = []) {
  const [EnvironmentName, region] = arr;
  const eb = new AWS.ElasticBeanstalk({ region });
  const metricsRawRes = await eb
    .describeInstancesHealth({
      AttributeNames: ['All'],
      EnvironmentName
    })
    .promise();
  const metricsRaw = omitDeep(metricsRawRes, ['Causes']);
  return {
    region,
    name: EnvironmentName,
    metricsRaw
  };
}

async function getAllMetrics(envs = []) {
  const settled = await pSettle(envs.map(getEnvironmentMetrics));
  return _.chain(settled)
    .filter({ isFulfilled: true })
    .map('value')
    .value();
}

function redirect(event, context) {
  const results = process.env.FRONTEND || 'https://servers.lol';
  const { PASSWORD: password } = process.env;
  context.succeed({
    body: `<html>
        <body>Redirecting to your results...</body>
        <script>
          var endpoint = window.location.href;
          window.location = '${results}' + '?endpoint=' + endpoint + '&password=' + '${password}'
        </script>
      </html>`,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

function noAuth(event, context) {
  context.succeed({
    body: `<html>
        <body>Incorrect password.</body>
      </html>`,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

exports.handler = async function get(event = {}, context) {
  const { data: enableData, password } = event.queryStringParameters;
  if (!enableData) {
    return redirect(event, context);
  }
  if (!password || !process.env.PASSWORD || password !== process.env.PASSWORD) {
    return noAuth(event, context);
  }
  try {
    const regionEnvs = await pSettle(regions.map(getEnvironments));
    const envs = _.chain(regionEnvs)
      .filter({ isFulfilled: true })
      .map('value')
      .flatten()
      .value();
    const metrics = await getAllMetrics(envs);
    const body = JSON.stringify(metrics);
    return context.succeed({
      body,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    throw err;
  }
};

process.env.TEST &&
  exports.handler(
    { queryStringParameters: { data: true } },
    { succeed: console.log }
  );
