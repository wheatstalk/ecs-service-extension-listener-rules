import { ServiceExtension } from '@aws-cdk-containers/ecs-service-extensions';
import * as ecs from '@aws-cdk/aws-ecs';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';

/**
 * Props for `ListenerRulesExtension`
 */
export interface ListenerRulesProps {
  /**
   * A name for this target group extension
   * @default 'http-load-balancer-listener-rules'
   */
  readonly name?: string;

  /**
   * Application listener to add rules to.
   */
  readonly listener: alb.IApplicationListener;

  /**
   * A set of rules
   */
  readonly rules?: ListenerRule[];

  /**
   * Starting priority number for automatic priorities.
   * @default 1
   */
  readonly priorityStart?: number;

  /**
   * Step size for automatic priority numbers.
   * @default 5
   */
  readonly priorityStep?: number;

  /**
   * Name of the container in the task to forward to.
   * @default 'app'
   */
  readonly containerName?: string;

  /**
   * Traffic port of the container to forward to.
   * @default 80
   */
  readonly trafficPort?: number;
}

/**
 * A load balancer listener rule.
 */
export interface ListenerRule {
  /**
   * Listener conditions to match.
   */
  readonly conditions: alb.ListenerCondition[];

  /**
   * Action.
   * @default forward to the service
   */
  readonly action?: alb.ListenerAction;

  /**
   * Rule priority.
   * @default automatically generated
   */
  readonly priority?: number;
}

/**
 * Basic options for adding rules
 */
export interface RuleOptions {
  /**
   * Priority for this rule
   * @default - automatically set
   */
  priority?: number;
}

/**
 * Options for adding a redirect rule.
 */
export interface RedirectRuleOptions extends RuleOptions, alb.RedirectOptions {
}

/**
 * Exposes the service from a load balancer listener via the listener rules
 * that you provide.
 */
export class ListenerRulesExtension extends ServiceExtension {
  /**
   * Create a load balancer rule matching on a host header that forwards to the
   * service.
   */
  static hostHeader(hostHeader: string, options?: RuleOptions): ListenerRule {
    return {
      conditions: [
        alb.ListenerCondition.hostHeaders([hostHeader]),
      ],
      priority: options?.priority,
    };
  }

  /**
   * Create a load balancer rule matching on a path pattern that forwards to
   * the service.
   */
  static pathPattern(pathPattern: string, options?: RuleOptions): ListenerRule {
    return {
      conditions: [
        alb.ListenerCondition.pathPatterns([pathPattern]),
      ],
      priority: options?.priority,
    };
  }

  /**
   * Create a load balancer rule matching on a host header that redirects via
   * HTTP to another URL.
   */
  static hostHeaderRedirect(hostHeader: string, options: RedirectRuleOptions): ListenerRule {
    return {
      ...ListenerRulesExtension.hostHeader(hostHeader, options),
      action: alb.ListenerAction.redirect(options),
    };
  }

  /**
   * Create a load balancer rule matching on a path pattern that redirects via
   * HTTP to another URL.
   */
  static pathPatternRedirect(pathPattern: string, options: RedirectRuleOptions): ListenerRule {
    return {
      ...ListenerRulesExtension.pathPattern(pathPattern, options),
      action: alb.ListenerAction.redirect(options),
    };
  }

  private readonly props: ListenerRulesProps;
  private priority: number;
  private readonly priorityStep: number;
  private readonly rules: ListenerRule[] = [];

  constructor(props: ListenerRulesProps) {
    super(props.name ?? 'http-load-balancer-listener-rules');
    this.props = props;
    this.priority = props.priorityStart ?? 1;
    this.priorityStep = props.priorityStep ?? 5;

    // Add the rules given by the constructor.
    if (props.rules) {
      for (const rule of props.rules) {
        this.addRule(rule);
      }
    }
  }

  /**
   * Add a load balancer listener rule to this http endpoint.
   */
  addRule(rule: ListenerRule) {
    this.rules.push(rule);
  }

  private nextPriority() {
    const priority = this.priority;
    this.priority += this.priorityStep;
    return priority;
  }

  useService(service: ecs.Ec2Service | ecs.FargateService) {
    super.useService(service);

    if (this.rules.length === 0) {
      // When there are no rules, we don't create the target group.
      return;
    }

    const targetGroup = new alb.ApplicationTargetGroup(this.scope, `load-balancer-listener-rules-${this.name}`, {
      vpc: this.parentService.ecsService.cluster.vpc,
      protocol: alb.ApplicationProtocol.HTTP,
      targets: [
        this.parentService.ecsService.loadBalancerTarget({
          containerName: this.props.containerName ?? 'app',
          containerPort: this.props.trafficPort ?? 80,
        }),
      ],
    });

    for (const rule of this.rules) {
      const priority = rule.priority ?? this.nextPriority();
      const action = rule.action ?? alb.ListenerAction.forward([targetGroup]);

      new alb.ApplicationListenerRule(this.scope, `${this.name}-rule-${priority}`, {
        ...rule,
        listener: this.props.listener,
        action: action,
        priority: priority,
      });
    }
  }
}