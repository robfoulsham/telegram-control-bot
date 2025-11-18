import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";

const ec2 = new EC2Client({
  region: process.env.AWS_REGION
});


export async function startInstance(instanceId) {
  await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
}

export async function stopInstance(instanceId) {
  await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
}

export async function getInstanceStatus(instanceId) {
  const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
  return res.Reservations[0].Instances[0].State.Name;
}
