import _ from 'lodash';
import AWS from 'aws-sdk';
import pSettle from 'p-settle';

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

function coerceMetrics(obj = {}) {
  const instances = obj.InstanceHealthList;
  return {
    instanceCount: instances.length,
    requestCount: _.chain(instances)
      .map('ApplicationMetrics.RequestCount')
      .sum()
      .value(),
    cpu: _.chain(instances)
      .map('System.CPUUtilization')
      .map(o => {
        return _.chain(o)
          .omit(['Idle'])
          .values()
          .sum()
          .value();
      })
      .mean()
      .round(3)
      .value(),
    types: _.chain(instances)
      .map('InstanceType')
      .value(),
    latency: _.chain(instances)
      .map('ApplicationMetrics.Latency.P75')
      .mean()
      .multiply(1000)
      .round()
      .value()
  };
}

async function getEnvironmentMetrics(arr = []) {
  const [EnvironmentName, region] = arr;
  const eb = new AWS.ElasticBeanstalk({ region });
  const metricsRaw = await eb
    .describeInstancesHealth({
      AttributeNames: ['All'],
      EnvironmentName
    })
    .promise();
  const metrics = coerceMetrics(metricsRaw);
  return {
    region,
    env: EnvironmentName,
    metricsRaw,
    metrics
  };
}

async function getAllMetrics(envs = []) {
  const settled = await pSettle(envs.map(getEnvironmentMetrics));
  return _.chain(settled)
    .filter({ isFulfilled: true })
    .map('value')
    .value();
}

exports.handler = async function get(event, context) {
  try {
    const regionEnvs = await pSettle(regions.map(getEnvironments));
    const envs = _.chain(regionEnvs)
      .filter({ isFulfilled: true })
      .map('value')
      .flatten()
      .value();
    const metrics = await getAllMetrics(envs);
    context.succeed({
      body: JSON.stringify(metrics)
    });
  } catch (err) {
    throw err;
  }
};

process.env.TEST && exports.handler({}, { succeed: console.log });
