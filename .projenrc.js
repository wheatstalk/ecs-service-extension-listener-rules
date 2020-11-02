const { TypeScriptProject } = require('projen');

const project = new TypeScriptProject({
    authorAddress: 'joshkellendonk@gmail.com',
    authorName: 'Josh Kellendonk',
    name: '@wheatstalk/ecs-service-extension-listener-rules',
    repository: 'https://github.com/wheatstalk/ecs-service-extension-listener-rules.git',
    // Use workflow dispatch from the github ui to release.
    releaseEveryCommit: false,
    releaseToNpm: true,
    deps: [
        '@aws-cdk-containers/ecs-service-extensions@^1.71.0',
        '@aws-cdk/aws-ecs@^1.71.0',
        '@aws-cdk/aws-elasticloadbalancingv2@^1.71.0',
        '@aws-cdk/core@^1.71.0',
    ],
    devDeps: [
        '@aws-cdk/assert@^1.71.0',
        '@aws-cdk/aws-ec2@^1.71.0',
    ],
    docgen: true,
});

project.gitignore.exclude('.idea', 'cdk.out');

project.synth();
