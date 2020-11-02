## Listener Rule Extension

This module provides an [ECS Service Extension](https://www.npmjs.com/package/@aws-cdk-containers/ecs-service-extensions)
that registers your service with an application load balancer by way of listener
rules.

Rules added via this extension are given an automatically numbered priority by
default. The automatic rule priority numbering starts at `priorityStart` and
increases by `priorityStep` for each generated rule priority.

## Get Started

To add this module to your project, install `@wheatstalk/ecs-service-extension-listener-rules`
with either `yarn` or `npm`:

```bash
# Yarn
yarn install @wheatstalk/ecs-service-extension-listener-rules

# NPM install
npm install @wheatstalk/ecs-service-extension-listener-rules
```

## Example Usage

You may expose your service by adding listener rules to an existing Application
Load Balancer listener. To accomplish this, you must set up your service
description and then add a new `ListenerRulesExtension`:

```ts
serviceDescription.add(new ListenerRulesExtension({
  listener, // Your IApplicationListener
  priorityStart: 10000, // Starting priority number (default is `1`)
  priorityStep: 5, // Step size for automatic numbering (default is `5`)
  rules: [
    // Serve requests for 'www.example.com'
    HttpLoadBalancerListenerRules.hostHeader('www.example.com'),
    // Redirect '*.example.com' to 'www.example.com'
    HttpLoadBalancerListenerRules.hostHeaderRedirect('*.example.com', {
      host: 'www.example.com',
    }),
    // Serve requests on a subpath '/somepath'
    HttpLoadBalancerListenerRules.pathPattern('/somepath'),
    // Redirect the path '/redirect' to 'aws.amazon.com'
    HttpLoadBalancerListenerRules.pathPatternRedirect('/redirect', {
      host: 'aws.amazon.com',
    }),
  ],
}));
```

## Note on JSII Support

This module won't support JSII until ECS Service Extensions introduces support
for JSII.
