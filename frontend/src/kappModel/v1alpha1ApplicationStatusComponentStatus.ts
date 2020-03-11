/**
 * Kapp Models
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { V1alpha1ApplicationStatusDeploymentStatus } from './v1alpha1ApplicationStatusDeploymentStatus';
import { V1alpha1ApplicationStatusServiceStatus } from './v1alpha1ApplicationStatusServiceStatus';

export class V1alpha1ApplicationStatusComponentStatus {
    'deploymentStatus'?: V1alpha1ApplicationStatusDeploymentStatus;
    'name': string;
    'serviceStatus'?: V1alpha1ApplicationStatusServiceStatus;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "deploymentStatus",
            "baseName": "deploymentStatus",
            "type": "V1alpha1ApplicationStatusDeploymentStatus"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "serviceStatus",
            "baseName": "serviceStatus",
            "type": "V1alpha1ApplicationStatusServiceStatus"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ApplicationStatusComponentStatus.attributeTypeMap;
    }
}

