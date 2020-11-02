import * as ecs_se from '@aws-cdk-containers/ecs-service-extensions';
import { expect as expectCDK, haveResourceLike, SynthUtils } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import { ListenerRulesExtension } from '../src';
import { ListenerRulesExtensionInteg } from './listener-rules-extension.integ';

test('it should produce listener rules', () => {
  // GIVEN
  const stack = new cdk.Stack();

  const environment = new ecs_se.Environment(stack, 'production');
  const serviceDescription = new ecs_se.ServiceDescription();
  serviceDescription.add(new ecs_se.Container({
    cpu: 256,
    memoryMiB: 512,
    trafficPort: 80,
    image: ecs.ContainerImage.fromRegistry('nathanpeck/name'),
  }));

  const loadBalancer = new alb.ApplicationLoadBalancer(stack, 'Alb', {
    internetFacing: true,
    vpc: environment.vpc,
  });

  const listener = loadBalancer.addListener('http', {
    protocol: alb.ApplicationProtocol.HTTP,
    defaultAction: alb.ListenerAction.fixedResponse(404, {
      contentType: 'text/plain',
      messageBody: '404 Not Found',
    }),
  });

  // WHEN
  serviceDescription.add(new ListenerRulesExtension({
    listener,
    rules: [
      ListenerRulesExtension.hostHeader('www.example.com'),
      ListenerRulesExtension.hostHeaderRedirect('*.example.com', {
        host: 'www.example.com',
      }),
      ListenerRulesExtension.pathPattern('/somepath'),
      ListenerRulesExtension.pathPatternRedirect('/redirect', {
        host: 'aws.amazon.com',
      }),
    ],
  }));

  new ecs_se.Service(stack, 'my-service', {
    environment,
    serviceDescription,
  });

  // THEN
  expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::TargetGroup'));

  // hostHeader()
  expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::ListenerRule', {
    Conditions: [
      {
        Field: 'host-header',
        HostHeaderConfig: {
          Values: ['www.example.com'],
        },
      },
    ],
    Actions: [{ Type: 'forward' }],
    Priority: 1,
  }));

  // hostHeaderRedirect()
  expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::ListenerRule', {
    Conditions: [
      {
        Field: 'host-header',
        HostHeaderConfig: {
          Values: ['*.example.com'],
        },
      },
    ],
    Actions: [{
      Type: 'redirect',
      RedirectConfig: {
        Host: 'www.example.com',
        StatusCode: 'HTTP_302',
      },
    }],
    Priority: 6,
  }));

  // pathPattern()
  expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::ListenerRule', {
    Conditions: [
      {
        Field: 'path-pattern',
        PathPatternConfig: {
          Values: ['/somepath'],
        },
      },
    ],
    Actions: [{ Type: 'forward' }],
    Priority: 11,
  }));

  // pathPatternRedirect()
  expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::ListenerRule', {
    Conditions: [
      {
        Field: 'path-pattern',
        PathPatternConfig: {
          Values: ['/redirect'],
        },
      },
    ],
    Actions: [{
      Type: 'redirect',
      RedirectConfig: {
        Host: 'aws.amazon.com',
        StatusCode: 'HTTP_302',
      },
    }],
    Priority: 16,
  }));
});

test('it does not produce a target group without rules', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  const environment = new ecs_se.Environment(stack, 'production');
  const serviceDescription = new ecs_se.ServiceDescription();
  serviceDescription.add(new ecs_se.Container({
    cpu: 256,
    memoryMiB: 512,
    trafficPort: 80,
    image: ecs.ContainerImage.fromRegistry('nathanpeck/name'),
  }));

  const loadBalancer = new alb.ApplicationLoadBalancer(stack, 'Alb', {
    internetFacing: true,
    vpc: environment.vpc,
  });

  const listener = loadBalancer.addListener('http', {
    protocol: alb.ApplicationProtocol.HTTP,
    defaultAction: alb.ListenerAction.fixedResponse(404, {
      contentType: 'text/plain',
      messageBody: '404 Not Found',
    }),
  });

  serviceDescription.add(new ListenerRulesExtension({
    listener,
  }));

  new ecs_se.Service(stack, 'my-service', {
    environment,
    serviceDescription,
  });

  // THEN
  expectCDK(stack).notTo(haveResourceLike('AWS::ElasticLoadBalancingV2::TargetGroup'));
});

test('listener-rules-extension snapshot test', () => {
  const app = new cdk.App();
  const stack = new ListenerRulesExtensionInteg(app, 'http-load-balancer-listener-rules-integ');

  // When this breaks, follow the testing instructions in
  // listener-rules.extension.integ.ts to deploy the app and verify it.
  // After verifying, delete the .snap file in __snap__ and re-run this
  // test to regenerate the snapshot.
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});