import _ from 'lodash';
import moment from 'moment';
import AWS from 'aws-sdk';

const eb = new AWS.ElasticBeanstalk();
const cloudwatch = new AWS.CloudWatch();
const ec2 = new AWS.EC2();

async function getEbApps() {
  // const apps = await eb.describeApplications().promise();
  const envs = await eb.describeEnvironments().promise();
  return _.chain(envs)
    .get('Environments')
    .groupBy('ApplicationName')
    .value();
}

(async () => {
  // console.log(JSON.stringify(await eb.describeApplications().promise()));
  // const envs = await getEbApps();
  // const ec2Metrics = await ec2.describeInstances().promise();
  // console.log(JSON.stringify(ec2Metrics));
  // console.log(envs);
  const params = {
    StartTime: moment()
      .subtract(6, 'h')
      .toDate()
      .toISOString(),
    EndTime: moment()
      .subtract(1, 'h')
      .toDate()
      .toISOString(),
    MetricName: 'ApplicationRequests2xx',
    // MetricName: 'ApplicationRequestsTotal',
    // MetricName: 'Invocations',
    // Namespace: 'AWS/Lambda',
    Namespace: 'ElasticBeanstalk',
    // Dimensions: [
    //   {
    //     Name: 'EnvironmentName',
    //     Value: 'iopipe-org-collector-prod'
    //   }
    // ],
    // seconds
    Period: 300,
    Statistics: ['Average', 'Sum']
  };
  // console.log(
  //   cloudwatch.getMetricStatistics(params).service.config.credentials
  // );
  const res = await cloudwatch.getMetricStatistics(params).promise();
  console.log('Cloudwatch response:');
  console.log(JSON.stringify(res));
})();
