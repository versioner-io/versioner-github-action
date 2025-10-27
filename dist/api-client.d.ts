import { DeploymentEventPayload, DeploymentEventResponse, BuildEventPayload, BuildEventResponse } from './types';
/**
 * Send deployment event to Versioner API
 */
export declare function sendDeploymentEvent(apiUrl: string, apiKey: string, payload: DeploymentEventPayload, failOnRejection?: boolean): Promise<DeploymentEventResponse>;
/**
 * Send build event to Versioner API
 */
export declare function sendBuildEvent(apiUrl: string, apiKey: string, payload: BuildEventPayload, failOnRejection?: boolean): Promise<BuildEventResponse>;
