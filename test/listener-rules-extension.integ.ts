import * as ecs_se from '@aws-cdk-containers/ecs-service-extensions';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';

import { ListenerRulesExtension } from '../src';

export class ListenerRulesExtensionInteg extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const environment = new ecs_se.Environment(this, 'Environment');

    const loadBalancer = new alb.ApplicationLoadBalancer(this, 'Alb', {
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

    const serviceDescription = new ecs_se.ServiceDescription();
    serviceDescription.add(new ecs_se.Container({
      cpu: 256,
      memoryMiB: 512,
      trafficPort: 80,
      image: ecs.ContainerImage.fromRegistry('nathanpeck/name'),
      environment: {
        PORT: '80',
      },
    }));

    serviceDescription.add(new ListenerRulesExtension({
      listener,
      rules: [
        ListenerRulesExtension.pathPattern('/name1'),
        ListenerRulesExtension.pathPattern('/name2'),
        ListenerRulesExtension.pathPatternRedirect('/redirect', {
          protocol: 'HTTPS',
          host: 'aws.amazon.com',
          port: '443',
          path: '/',
        }),
      ],
    }));

    const service = new ecs_se.Service(this, 'Service', {
      environment,
      serviceDescription,
    });

    service.ecsService.connections.allowFrom(loadBalancer, ec2.Port.allTcp());

    new cdk.CfnOutput(this, 'Error404Endpoint', {
      value: cdk.Fn.sub('http://${AlbDns}', {
        AlbDns: loadBalancer.loadBalancerDnsName,
      }),
    });

    new cdk.CfnOutput(this, 'NameEndpoint1', {
      value: cdk.Fn.sub('http://${AlbDns}/name1', {
        AlbDns: loadBalancer.loadBalancerDnsName,
      }),
    });

    new cdk.CfnOutput(this, 'NameEndpoint2', {
      value: cdk.Fn.sub('http://${AlbDns}/name2', {
        AlbDns: loadBalancer.loadBalancerDnsName,
      }),
    });

    new cdk.CfnOutput(this, 'RedirectToAmazon', {
      value: cdk.Fn.sub('http://${AlbDns}/redirect', {
        AlbDns: loadBalancer.loadBalancerDnsName,
      }),
    });
  }
}

new ListenerRulesExtensionInteg(new cdk.App(), 'http-load-balancer-listener-rules-integ');

/**
 * Expect this stack to deploy. The stack outputs include several URLs to test
 * with a browser after the services have settled. Error404Endpoint should show
 * you an error 404. NameEndpoint1 and NameEndpoint2 should show the name
 * container's output. RedirectToAmazon should redirect you to the AWS website.
 *
 * Example:
 *
 * ```
 * $ cdk --app 'npx ts-node --project tsconfig.jest.json test/listener-rules-extension.integ.ts' deploy
 * ...
 * Outputs:
 * http-load-balancer-listener-rules-integ.Error404Endpoint = http://someurl
 * http-load-balancer-listener-rules-integ.NameEndpoint1 = http://someurl/name1
 * http-load-balancer-listener-rules-integ.NameEndpoint2 = http://someurl/name2
 * http-load-balancer-listener-rules-integ.RedirectToAmazon = http://someurl/redirect
 * ...
 *
 * $ xdg-open http://someurl
 * $ xdg-open http://someurl/name1
 * $ xdg-open http://someurl/name2
 * $ xdg-open http://someurl/redirect
 * ```
 */
