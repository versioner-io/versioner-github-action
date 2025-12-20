import { DeploymentEventPayload, DeploymentEventResponse, BuildEventPayload, BuildEventResponse } from './types';
/**
 * Send deployment event to Versioner API
 */
export declare function sendDeploymentEvent(apiUrl: string, apiKey: string, payload: DeploymentEventPayload, failOnApiError?: boolean): Promise<DeploymentEventResponse>;
/**
 * Send build event to Versioner API
 */
export declare function sendBuildEvent(apiUrl: string, apiKey: string, payload: BuildEventPayload, failOnApiError?: boolean): Promise<BuildEventResponse>;
