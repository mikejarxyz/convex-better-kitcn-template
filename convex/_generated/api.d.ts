/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authSchema from "../authSchema.js";
import type * as auth_impl_access from "../auth_impl/access.js";
import type * as generated_auth from "../generated/auth.js";
import type * as generated_server from "../generated/server.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_errors from "../lib/errors.js";
import type * as shared_api from "../shared/api.js";
import type * as things from "../things.js";
import type * as things_impl_model from "../things_impl/model.js";
import type * as things_impl_repo from "../things_impl/repo.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authSchema: typeof authSchema;
  "auth_impl/access": typeof auth_impl_access;
  "generated/auth": typeof generated_auth;
  "generated/server": typeof generated_server;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/errors": typeof lib_errors;
  "shared/api": typeof shared_api;
  things: typeof things;
  "things_impl/model": typeof things_impl_model;
  "things_impl/repo": typeof things_impl_repo;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
