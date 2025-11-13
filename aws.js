const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({ region: process.env.AWS_REGION });

async function startInstance(instanceId) {
  try {
    await ec2.startInstances({ InstanceIds: [instanceId] }).promise();
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function stopInstance(instanceId) {
  try {
    await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function getInstanceStatus(instanceId) {
  try {
    const result = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
    return result.Reservations[0].Instances[0].State.Name; // "running", "stopped", etc.
  } catch (err) {
    return 'unknown';
  }
}

module.exports = {
  startInstance,
  stopInstance,
  getInstanceStatus
};
