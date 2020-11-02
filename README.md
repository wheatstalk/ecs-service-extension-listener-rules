## Listener Rule Extension

This module provides an [ECS Service Extension](https://www.npmjs.com/package/@aws-cdk-containers/ecs-service-extensions)
that registers your service with an application load balancer by way of listener
rules.

Rules added via this extension are automatically prioritized in the load balancer
by default. The automatic prioritization starts at a number (default: 1) and
increases by a step value (default: 5) for each rule added that doesn't have an
explicit priority.

## Get Started

To add this module to your project, install `@wheatstalk/ecs-service-extension-listener-rules`
with either `yarn` or `npm`:

```bash
# Yarn
yarn add @wheatstalk/ecs-service-extension-listener-rules

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
  rules: [
    // Serve requests for 'www.example.com'
    ListenerRulesExtension.hostHeader('www.example.com'),
    // Redirect '*.example.com' to 'www.example.com'
    ListenerRulesExtension.hostHeaderRedirect('*.example.com', {
      host: 'www.example.com',
    }),
    // Serve requests on a subpath '/somepath'
    ListenerRulesExtension.pathPattern('/somepath'),
    // Redirect the path '/redirect' to 'aws.amazon.com'
    ListenerRulesExtension.pathPatternRedirect('/redirect', {
      host: 'aws.amazon.com',
    }),
  ],
}));
```

## Choosing Priorities

If you have specific requirements for ALB priorities, you may set the rule
priorities in either of two ways:

* Provide a `priorityStart` to the extension props
* Provide a `priority` option for a specific rule

**Priority examples**

```ts
serviceDescription.add(new ListenerRulesExtension({
  listener, // Your IApplicationListener
  priorityStart: 10000, // Starting priority number (default is `1`)
  priorityStep: 5, // Step size for automatic numbering (default is `5`)
  rules: [
    // Serve requests for 'www.example.com' - will be priority 10000
    ListenerRulesExtension.hostHeader('www.example.com'),
    // Register the wildcard host header so that has the priority 39999
    ListenerRulesExtension.hostHeader('*.example.com', {
      priority: 39999,
    }),
  ],
}));
```

## Note on JSII Support

This module won't support JSII until ECS Service Extensions introduces support
for JSII.
