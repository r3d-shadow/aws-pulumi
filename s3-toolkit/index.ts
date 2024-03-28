import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createS3Bucket, configureBucketServerSideEncryption, configureBucketOwnershipControls, configureBucketAcl, configureBucketCors, configureBucketPolicy, configureBucketPublicAccessBlock, configureBucketLifecycle, configureBucketLogging } from './src/s3'

(async () => {
    const provider = new aws.Provider("primary", { region: 'us-east-1'} );

    const bucketName = "example-bucket";
    const pulumiId = "random-id";

    const bucket = await createS3Bucket({
        pulumiId: pulumiId,
        name: bucketName,
        provider: provider
    });

    await configureBucketServerSideEncryption({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    const bucketOwnershipControls = await configureBucketOwnershipControls({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    await configureBucketAcl({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    await configureBucketCors({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    await configureBucketPolicy({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        bucketName: bucketName,
        dependsOn: [bucket, bucketOwnershipControls],
        provider: provider
    });

    await configureBucketPublicAccessBlock({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    await configureBucketLifecycle({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });

    await configureBucketLogging({
        pulumiId: pulumiId,
        bucketId: bucket.id,
        provider: provider
    });
})();