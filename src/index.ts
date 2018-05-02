import * as HTTPS from 'https';
import * as URL from 'url';
import { SubscriptionAttributes } from './lib/subscription-attributes';

const getCallback = (event:any, context:any, callback:any) => (error?:any, result?:any) => {
	const responseStatus = error ? 'FAILED' : 'SUCCESS';
	const parsedUrl = URL.parse(event.ResponseURL);
	const responseBody = JSON.stringify({
		Status: responseStatus,
		Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
		PhysicalResourceId: `${event.StackId}_${event.LogicalResourceId}`,
		StackId: event.StackId,
		RequestId: event.RequestId,
		LogicalResourceId: event.LogicalResourceId,
		Data: error || result
	});
	console.log('Callback called: ', responseBody)
	const options = {
		hostname: parsedUrl.hostname,
		port: 443,
		path: parsedUrl.path,
		method: 'PUT',
		headers: {
			'content-type': '',
			'content-length': responseBody.length
		}
	};

	const request = HTTPS.request(options, _ => _.on('data', _ => callback(_)));
	request.on('error', _ => callback(_));
	request.write(responseBody);
	request.end();
};

export const handler = (event:any, context:any, cb:any) => {
	console.log('event', JSON.stringify(event));
	console.log('context', JSON.stringify(context));

	const callback = getCallback(event, context, cb);

	SubscriptionAttributes.init(event, context).then((requestMethods:any) => {
		return requestMethods[event.RequestType.toLowerCase()]()
			.then((_:any) => {
				console.log('success', JSON.stringify(_));
				return callback(null, {});
			})
			.catch((_:any) => {
				console.error('failed', JSON.stringify(_, Object.getOwnPropertyNames(_)));
				callback({error: _}, null)
			});
	})
};
