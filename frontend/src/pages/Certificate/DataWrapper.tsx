import React from "react";
import { connect } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { RootState } from "reducers";
import { Actions } from "types";

const mapStateToProps = (state: RootState) => {
  const certificates = state.get("certificates");
  return {
    componentTemplates: certificates.get("certificates"),
    isLoading: certificates.get("isLoading"),
    isFirstLoaded: certificates.get("isFirstLoaded"),
  };
};

export interface WithCertificatesDataProps extends ReturnType<typeof mapStateToProps> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

export const CertificateDataWrapper = (WrappedComponent: React.ComponentType<any>) => {
  const WithCertificatesData: React.ComponentType<WithCertificatesDataProps> = class extends React.Component<
    WithCertificatesDataProps
  > {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  WithCertificatesData.displayName = `WithCertificatesData(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps)(WithCertificatesData);
};

function getDisplayName(WrappedComponent: React.ComponentType) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
