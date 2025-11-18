import {
  EventBridgeClient,
  DescribeRuleCommand,
  EnableRuleCommand,
  DisableRuleCommand
} from "@aws-sdk/client-eventbridge";

const eb = new EventBridgeClient({});

export async function getRuleState(ruleName) {
  const cmd = new DescribeRuleCommand({ Name: ruleName });
  const res = await eb.send(cmd);
  return res.State; // "ENABLED" | "DISABLED"
}

export async function enableRule(ruleName) {
  try {
    await eb.send(new EnableRuleCommand({ Name: ruleName }));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function disableRule(ruleName) {
  try {
    await eb.send(new DisableRuleCommand({ Name: ruleName }));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
