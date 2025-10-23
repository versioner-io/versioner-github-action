import { DeploymentEventPayload, DeploymentEventResponse } from './types';
/**
 * Send deployment event to Versioner API
 */
export declare function sendDeploymentEvent(apiUrl: string, apiKey: string, payload: DeploymentEventPayload): Promise<DeploymentEventResponse>;
