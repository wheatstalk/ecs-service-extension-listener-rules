## Adding listener rules to an existing load balancer

You may expose your service by adding listener rules to an existing Application
Load Balancer listener. To accomplish this, you must set up your service
description and then add a new `HttpLoadBalancerListenerRules`.

Rules added via this extension are given an automatically numbered priority by
default. The automatic rule priority numbering starts at `priorityStart` and
increases by `priorityStep` for each generated rule priority.

```ts
serviceDescription.add(new HttpLoadBalancerListenerRules({
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