import Immutable from "immutable";
import { ImmutableMap } from "../typings";
import {
  CREATE_COMPONENT_ACTION,
  Component,
  UPDATE_COMPONENT_ACTION,
  DELETE_COMPONENT_ACTION,
  DUPLICATE_COMPONENT_ACTION,
  LOAD_COMPONENT_TEMPLATES_ACTION
} from "../actions";
import { Actions } from "../actions";

export type State = ImmutableMap<{
  components: Immutable.OrderedMap<string, Component>;
}>;

const initialState: State = Immutable.Map({
  components: Immutable.OrderedMap()
});

// const initialState: State = Immutable.Map({
//   components: Immutable.OrderedMap<Component>({
//     "0": Immutable.Map({
//       id: "0",
//       name: "postgres",
//       image: "postgres",
//       command: "",
//       env: Immutable.List([
//         Immutable.Map({
//           name: "POSTGRES_PASSWORD",
//           type: "static",
//           value: "password"
//         }),
//         Immutable.Map({
//           name: "POSTGRES_USER",
//           type: "static",
//           value: "admin"
//         }),
//         Immutable.Map({
//           name: "POSTGRES_DB",
//           type: "static",
//           value: "db"
//         })
//       ]),
//       ports: Immutable.List([
//         Immutable.Map({
//           name: "port",
//           protocol: "TCP",
//           containerPort: 5432,
//           servicePort: 5432
//         })
//       ]),
//       cpu: 1000,
//       memory: 1000,
//       disk: Immutable.List([
//         Immutable.Map({
//           name: "pg-data",
//           type: "new",
//           path: "/var/usr/postgres/data",
//           existDisk: "",
//           size: "300",
//           storageClass: "gcp-ssd"
//         })
//       ])
//     }),
//     "1": Immutable.Map({
//       id: "1",
//       name: "redis",
//       image: "redis/redis:latest",
//       command: "",
//       env: Immutable.List([]),
//       ports: Immutable.List([
//         Immutable.Map({
//           name: "port",
//           protocol: "TCP",
//           containerPort: 6379,
//           servicePort: 6379
//         })
//       ]),
//       cpu: 2600,
//       memory: 2000,
//       disk: Immutable.List([
//         Immutable.Map({
//           name: "redis-data-disk",
//           type: "new",
//           path: "/data",
//           existDisk: "",
//           size: "300",
//           storageClass: "gcp-ssd"
//         })
//       ])
//     })
//   })
// });

const reducer = (state: State = initialState, action: Actions): State => {
  switch (action.type) {
    case LOAD_COMPONENT_TEMPLATES_ACTION: {
      let om = Immutable.OrderedMap<string, Component>();

      action.payload.components.forEach(x => {
        om = om.set(x.get("id"), x);
      });

      state = state.set("components", om);
      break;
    }
    case CREATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const tmpId = components.size.toString(); // TODO fake id
      let component = action.payload.component;
      component = component.set("id", tmpId);
      state = state.set(
        "components",
        components.set(
          tmpId, // TODO fake id
          component
        )
      );
      break;
    }
    case UPDATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const id = action.payload.componentId;
      let component = action.payload.component;
      component = component.set("id", id);
      state = state.set("components", components.set(id, component));
      break;
    }
    case DELETE_COMPONENT_ACTION: {
      state = state.deleteIn(["components", action.payload.componentId]);
      break;
    }
    case DUPLICATE_COMPONENT_ACTION: {
      const components = state.get("components");
      const tmpId = components.size.toString(); // TODO fake id

      let component = components.get(action.payload.componentId)!;
      component = component.set("id", tmpId);

      let i = 0;
      let name = "";
      do {
        i += 1;
        name = `${component.get("name")}-duplicate-${i}`;
      } while (components.find(x => x.get("name") === name));

      component = component.set("name", name);
      state = state.set("components", components.set(tmpId, component));
      break;
    }
  }
  return state;
};

export default reducer;
