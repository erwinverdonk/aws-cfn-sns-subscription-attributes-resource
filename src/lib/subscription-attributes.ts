import * as AWS from 'aws-sdk';
import { AnalyticsAndOperator } from 'aws-sdk/clients/s3';
import { AnalysisScheme } from 'aws-sdk/clients/cloudsearch';

const createUpdateSubscriptionAttributes = (sns:any, props:any, oldProps?:any) => () => {
	const attributes = props.Attributes;
	const oldAttributes = oldProps ? oldProps.Attributes : [];

	const attToRemove = oldAttributes.filter((oldAtt:any) => {
		return !attributes.some((att:any) => att.Name === oldAtt.Name);
	});

	const attToAdd = attributes.filter((att:any) => {
		return !oldAttributes.some((oldAtt:any) => oldAtt.Name === att.Name);
	});

	const attToUpdate = attributes.filter((att:any) => {
		return oldAttributes.some((oldAtt:any) => (
			oldAtt.Name === att.Name &&
			oldAtt.Value !== att.Value
		));
	});

	console.log('Attributes:', JSON.stringify(attributes));
	console.log('Old attributes:', JSON.stringify(oldAttributes));

	console.log('Attributes to add:', JSON.stringify(attToAdd));
	console.log('Attributes to update:', JSON.stringify(attToUpdate));

	return Promise.all(
		attToRemove.map((att:any) => sns.setSubscriptionAttributes({
			SubscriptionArn: props.SubscriptionArn,
			AttributeName: att.Name,
			AttributeValue: att.DefaultValue
		}).promise()).concat(
			attToAdd.map((att:any) => sns.setSubscriptionAttributes({
				SubscriptionArn: props.SubscriptionArn,
				AttributeName: att.Name,
				AttributeValue: att.Value
			}).promise()),
			attToUpdate.map((att:any) => sns.setSubscriptionAttributes({
				SubscriptionArn: props.SubscriptionArn,
				AttributeName: att.Name,
				AttributeValue: att.Value
			}).promise())
		)
	);
};

const deleteSubscriptionAttributes = (sns:any, props:any) => () => {
	const attributes = props.Attributes;

	console.log('Attributes to remove:', JSON.stringify(attributes));

	return Promise.all(
		attributes.map((att:any) => sns.setSubscriptionAttributes({
			SubscriptionArn: props.SubscriptionArn,
			AttributeName: att.Name,
			AttributeValue: att.DefaultValue
		}).promise())
	);
};

export const SubscriptionAttributes = {
	init: (event:any, context:any) => {
		const props = event.ResourceProperties;
		const oldProps = event.OldResourceProperties;
		const sns = new AWS.SNS();

		const run = () => {
			return Promise.resolve({
				create: createUpdateSubscriptionAttributes(sns, props),
				update: createUpdateSubscriptionAttributes(sns, props, oldProps),
				delete: deleteSubscriptionAttributes(sns, props)
			});
		};

		if(!props.SubscriptionArn){
			return sns.listSubscriptionsByTopic({
				TopicArn: props.TopicArn
			})
				.promise()
				.then(result => {
					props.SubscriptionArn = result.Subscriptions.find(
						_ => _.Endpoint === props.Endpoint
					).SubscriptionArn;

					return run();
				});
		} else {
			return run();
		}
	}
};
