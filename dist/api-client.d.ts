import { DeploymentEventPayload, DeploymentEventResponse, VersionEventPayload, VersionEventResponse } from './types';
/**
 * Send deployment event to Versioner API
 */
export declare function sendDeploymentEvent(apiUrl: string, apiKey: string, payload: DeploymentEventPayload, failOnRejection?: boolean): Promise<DeploymentEventResponse>;
/**
 * Send version event (build) to Versioner API
 */
export declare function sendVersionEvent(apiUrl: string, apiKey: string, payload: VersionEventPayload, failOnRejection?: boolean): Promise<VersionEventResponse>;
