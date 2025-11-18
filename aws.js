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
  try {
    const result = await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = result.StartingInstances?.[0];
    const currentState = instance?.CurrentState?.Name;
    const previousState = instance?.PreviousState?.Name;

    return {
      success: currentState === 'pending' || currentState === 'running',
      currentState,
      previousState,
    };
  } catch (error) {
    return { success: false, error };
  }
}

export async function stopInstance(instanceId) {
  try {
    const result = await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = result.StoppingInstances?.[0];
    const currentState = instance?.CurrentState?.Name;
    const previousState = instance?.PreviousState?.Name;

    return { 
      success: currentState === 'stopping' || currentState === 'stopped',
      currentState,
      previousState
    };
  } catch (error) {
    return { success: false, error };
  }
}


export async function getInstanceStatus(instanceId) {
  const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
  return res.Reservations[0].Instances[0].State.Name;
}
