/**
 * Kubernetes
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1.15.5
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { ExtensionsV1beta1ScaleSpec } from './extensionsV1beta1ScaleSpec';
import { ExtensionsV1beta1ScaleStatus } from './extensionsV1beta1ScaleStatus';
import { V1ObjectMeta } from './v1ObjectMeta';

/**
* represents a scaling request for a resource.
*/
export class ExtensionsV1beta1Scale {
    /**
    * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#resources
    */
    'apiVersion'?: string;
    /**
    * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#types-kinds
    */
    'kind'?: string;
    'metadata'?: V1ObjectMeta;
    'spec'?: ExtensionsV1beta1ScaleSpec;
    'status'?: ExtensionsV1beta1ScaleStatus;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "kind",
            "baseName": "kind",
            "type": "string"
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "V1ObjectMeta"
        },
        {
            "name": "spec",
            "baseName": "spec",
            "type": "ExtensionsV1beta1ScaleSpec"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "ExtensionsV1beta1ScaleStatus"
        }    ];

    static getAttributeTypeMap() {
        return ExtensionsV1beta1Scale.attributeTypeMap;
    }
}

