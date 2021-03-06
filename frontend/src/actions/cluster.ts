import { ThunkResult } from "types";
import { LOAD_CLUSTER_INFO_FAILED, LOAD_CLUSTER_INFO_FULFILlED, LOAD_CLUSTER_INFO_PENDING } from "types/cluster";
import { api } from "api";

export const loadClusterInfoAction = (): ThunkResult<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CLUSTER_INFO_PENDING });

    try {
      const info = await api.getClusterInfo();

      dispatch({
        type: LOAD_CLUSTER_INFO_FULFILlED,
        payload: info,
      });
    } catch (e) {
      dispatch({ type: LOAD_CLUSTER_INFO_FAILED });
      throw e;
    }
  };
};
