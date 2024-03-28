import * as aws from "@pulumi/aws";
import { PolicyDocument } from "@pulumi/aws/iam/documents";
import * as pulumi from "@pulumi/pulumi";
import { Input, Resource } from "@pulumi/pulumi";
import { ALLOWED_ORIGINS, TAGS } from "./constants";

interface S3BucketInput {
    pulumiId: string;
    name: string;
    provider: pulumi.ProviderResource;
}

interface BucketConfigInput {
    pulumiId: string;
    bucketId: pulumi.Input<string>;
    provider: pulumi.ProviderResource;
    dependsOn?: Input<Input<Resource>[]> | Input<Resource>;
}

interface BucketPolicyConfigInput extends BucketConfigInput {
    bucketName: string;
}

async function createS3Bucket(input: S3BucketInput): Promise<aws.s3.BucketV2> {
    const { pulumiId, name, provider } = input;

    const bucket = new aws.s3.BucketV2(pulumiId, {
        bucket: name,
        objectLockEnabled: false,
        tags: {
            Environment: name,
            Name: name,
            ...TAGS
        },
    }, {
        provider: provider,
    });
    return bucket;
}

async function configureBucketServerSideEncryption(input: BucketConfigInput): Promise<aws.s3.BucketServerSideEncryptionConfigurationV2> {
    const { pulumiId, bucketId, provider } = input;
    
    const bucketServerSideEncryptionConfigurationV2 = new aws.s3.BucketServerSideEncryptionConfigurationV2(`${pulumiId}`, {
        bucket: bucketId,
        rules: [{
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        }],
    }, {
        provider: provider,
    });

    return bucketServerSideEncryptionConfigurationV2;
}

async function configureBucketOwnershipControls(input: BucketConfigInput): Promise<aws.s3.BucketOwnershipControls> {
    const { pulumiId, bucketId, provider } = input;

    const bucketOwnershipControls = new aws.s3.BucketOwnershipControls(`${pulumiId}`, {
        bucket: bucketId,
        rule: {
            objectOwnership: "BucketOwnerPreferred",
        },
    }, {
        provider: provider,
    });

    return bucketOwnershipControls;
}

async function configureBucketAcl(input: BucketConfigInput): Promise<aws.s3.BucketAclV2> {
    const { pulumiId, bucketId, provider } = input;

    const bucketAcl = new aws.s3.BucketAclV2(`${pulumiId}`, {
        bucket: bucketId,
        acl: "private",
    }, {
        provider: provider
    });

    return bucketAcl;
}

async function configureBucketCors(input: BucketConfigInput): Promise<aws.s3.BucketCorsConfigurationV2> {
    const { pulumiId, bucketId, provider } = input;

    const bucketCorsConfigurationV2 = new aws.s3.BucketCorsConfigurationV2(`${pulumiId}`, {
        bucket: bucketId,
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: [
                    "GET",
                    "PUT",
                    "POST",
                ],
                allowedOrigins: ALLOWED_ORIGINS,
                exposeHeaders:  [],
                maxAgeSeconds: 3000
            }
        ],
    }, {
        provider: provider,
    });

    return bucketCorsConfigurationV2;
}

async function configureBucketPolicy(input: BucketPolicyConfigInput): Promise<aws.s3.BucketPolicy> {
    const { pulumiId, bucketId, bucketName, dependsOn, provider } = input;

    const bucketPolicy = pulumi.jsonStringify(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": [
                    "s3:GetObject"
                    ],
                    "Resource": `arn:aws:s3:::${bucketName}/public/*`
                },
                {
                    "Sid": "S3ServerAccessLogsPolicy",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "logging.s3.amazonaws.com"
                    },
                    "Action": [
                        "s3:PutObject"
                    ],
                    "Resource": `arn:aws:s3:::${bucketName}/server-access-logs*`,
                    "Condition": {
                        "ArnLike": {
                            "aws:SourceArn": `arn:aws:s3:::${bucketName}`
                        },
                    }
                }
            ]
        },
    );
    const createdBucketPolicy = new aws.s3.BucketPolicy(pulumiId, {
        bucket: bucketId,
        policy: bucketPolicy,
    }, {
        dependsOn: dependsOn,
        provider: provider,
    });
    return createdBucketPolicy;
}

async function configureBucketPublicAccessBlock(input: BucketConfigInput): Promise<aws.s3.BucketPublicAccessBlock> {
    const { pulumiId, bucketId, provider } = input;

    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(pulumiId, {
        bucket: bucketId,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
    }, {
        provider: provider,
    });

    return bucketPublicAccessBlock;
}

async function configureBucketLifecycle(input: BucketConfigInput): Promise<aws.s3.BucketLifecycleConfigurationV2> {
    const { pulumiId, bucketId, provider } = input;
    const exportFolder = 'export-folder';
    const bucketLifecycleConfigurationV2 = new aws.s3.BucketLifecycleConfigurationV2(pulumiId, {
        bucket: bucketId,
        rules: [
            {
                expiration: {
                    days: 3,
                },
                filter: {
                    prefix: `${exportFolder}/`,
                },
                id: 'exportFolder',
                status: "Enabled",
            },
        ],
    }, {
        provider: provider,
    });

    return bucketLifecycleConfigurationV2;
}

async function configureBucketLogging(input: BucketConfigInput): Promise<aws.s3.BucketLoggingV2> {
    const { pulumiId, bucketId, provider } = input;

    const bucketLogging = new aws.s3.BucketLoggingV2(pulumiId, {
        bucket: bucketId,
        targetBucket: bucketId,
        targetPrefix: "server-access-logs/",
    }, {
        provider: provider,
    });

    return bucketLogging;
}

export {
    createS3Bucket,
    configureBucketServerSideEncryption,
    configureBucketOwnershipControls,
    configureBucketAcl,
    configureBucketCors,
    configureBucketPolicy,
    configureBucketPublicAccessBlock,
    configureBucketLifecycle,
    configureBucketLogging
};
