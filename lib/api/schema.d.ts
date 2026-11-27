/**
 * Generated from the kiki-api OpenAPI document by scripts/api-types.mjs. Do not edit by hand.
 * Regenerate with `pnpm api:types` after the API changes.
 */

export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness probe */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            status: "ok";
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/whoami": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The verified caller */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            clerkUserId: string;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labels/{boardId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Labels of a board */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Label"][];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create a label on a board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title?: string;
                        color: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Label"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/labels/{labelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a label */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    labelId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Rename or recolour a label */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    labelId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title?: string;
                        color?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Label"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/lists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a list at the end of a board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                        boardId: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["List"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/lists/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Set the order of the lists of a board */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        boardId: string;
                        lists: {
                            id: string;
                            order: number;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/lists/{listId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a list and its tickets */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    listId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Rename a list */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    listId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["List"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Unread notifications of the caller */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Notification"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Mark every notification as read */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            ok: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/notifications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Mark one notification as read */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            ok: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tickets due in a month, on the boards the caller can read */
        get: {
            parameters: {
                query?: {
                    year?: number;
                    month?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CalendarTask"][];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/mcp/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The changes made through MCP connections in an organization or board (admins only); with `changeId`, one change and the names it mentions */
        get: {
            parameters: {
                query: {
                    organizationId: string;
                    boardId?: string;
                    changeId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["McpChange"][] | components["schemas"]["McpChangeDetail"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Undo one MCP change; it needs `confirm: true` and fails if a ticket changed since */
        post: {
            parameters: {
                query: {
                    organizationId: string;
                    boardId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        changeId: string;
                        /** @enum {boolean} */
                        confirm: true;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            changeId: string;
                            revertedChangeId: string;
                            tickets: unknown[];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/mcp/oauth-clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The active OAuth clients the caller registered */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["McpOAuthClient"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Register an OAuth client for Claude (fixed callbacks) or ChatGPT (its own callback); the secret is shown once */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        provider?: "chatgpt" | "claude";
                        redirectUri?: string;
                        allowWrite?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatedMcpOAuthClient"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Revoke an OAuth client the caller registered, and every token it granted */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        id: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/mcp/oauth/consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * What a person can connect to an OAuth client that asks for access: the organizations and boards they administer
         * @description Send the query string of the authorization request exactly as the client built it (`client_id`, `redirect_uri`, `response_type`, `code_challenge`, `code_challenge_method`, `resource`, `state`, optional `scope`). It is read from the URL because a client may add parameters.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["McpConsentOptions"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Answer an OAuth client's request for access; the answer is the address to send the person back to */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        params: string;
                        /** @enum {string} */
                        decision: "allow" | "deny";
                        selection?: string;
                        writeAccess?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            redirectTo: string;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/clerk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Clerk's webhook: an updated account refreshes the user's name and email, a deleted one removes the user */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            received: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search boards and tickets the caller can read */
        get: {
            parameters: {
                query?: {
                    q?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SearchResult"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Boards the caller can read, newest first */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Board"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create a board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                        description?: string;
                        color?: string;
                        lists?: string[];
                        organizationId?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Board"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a board with everything in it (owner only) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Rename a board (owner only) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Board"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The latest 100 activity entries of a board */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ActivityLog"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Useful links pinned to a board */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardLink"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Replace the links of a board (owner only) */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["BoardLinkInput"][];
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardLink"][];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Who can assign, and how Kiki runs on this board (owner or admin) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        memberCanAssign?: boolean;
                        /** @enum {string} */
                        kikiMode?: "off" | "owner" | "member";
                        kikiTriage?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            memberCanAssign: boolean;
                            kikiMode: string;
                            kikiTriage: boolean;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/organization": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Move a board to another organization (owner only; needs the confirmation text) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @default  */
                        organizationId?: string;
                        /** @default  */
                        confirmation?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            organizationId: string;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/me/workspace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What the app shell needs: the caller's id and appearance, and the boards they can read with their organization */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Workspace"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/boards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The boards the caller can read, with how many tickets and lists each has */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardCard"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Open tickets the caller is assigned to, collaborates on or reviews as QA, with the lists of each board */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MyTasks"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The home screen: totals, what is due soon, recent activity, the caller's tickets and their last week */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Dashboard"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/view": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A board as its screen draws it: lists with their tickets, who can be assigned, and the caller's role */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardView"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/shared/tasks/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The read-only view behind a ticket's public link */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    token: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SharedTask"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * SSE stream of domain events for a board
         * @description Authenticated long-lived stream. Use fetch + ReadableStream (EventSource cannot send Authorization). Heartbeat comments keep proxies alive; ACL is re-checked on each heartbeat.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/onboarding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Mark onboarding milestones of the caller */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        dismissed?: boolean;
                        tourSeen?: boolean;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            onboardingDismissedAt: string | null;
                            tourSeenAt: string | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Access policy of a board and its team grants (owner or admin) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardAccess"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Replace the access policy and the team grants of a board (owner or admin) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        accessMode: "organization" | "restricted";
                        /** @enum {string} */
                        defaultRole: "viewer" | "member";
                        /** @default [] */
                        teamGrants?: {
                            teamId: string;
                            /** @enum {string} */
                            role: "admin" | "member" | "viewer";
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            accessMode: string;
                            defaultRole: string;
                            teamGrants: {
                                teamId: string;
                                /** @enum {string} */
                                role: "admin" | "member" | "viewer";
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Archived tasks of a board, most recently archived first */
        get: {
            parameters: {
                query?: {
                    quarter?: string;
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            tasks: components["schemas"]["ArchivedTask"][];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Archive tasks: the ones listed, or those matching the filters, or every active task */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        taskIds?: string[];
                        completedOnly?: boolean;
                        quarter?: string | null;
                        /** @description Only tasks created on or before this moment */
                        beforeDate?: string | null;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            archivedCount: number;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        /** Restore archived tasks to the board */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        taskIds: string[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            unarchivedCount: number;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/epics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Epics of a board with the progress of their active tasks */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            epics: components["schemas"]["EpicProgress"][];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create an epic */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                        description?: string | null;
                        color?: string | null;
                        quarter?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Epic"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Delete an epic; its tasks stay, without an epic */
        delete: {
            parameters: {
                query: {
                    epicId: string;
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Change an epic; only the fields sent change */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        id: string;
                        title?: string;
                        description?: string | null;
                        color?: string;
                        quarter?: string | null;
                        /** @enum {string} */
                        status?: "open" | "completed";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Epic"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/quarters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Board quarter calendar */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            quarters: components["schemas"]["BoardQuarter"][];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Upsert quarter rows on the board calendar */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        quarters: {
                            key: string;
                            /** Format: date-time */
                            startDate: string;
                            /** Format: date-time */
                            endDate: string;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            quarters: components["schemas"]["BoardQuarter"][];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/hierarchy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** SVG diagram of a task's parent and child tasks */
        get: {
            parameters: {
                query: {
                    taskId: string;
                    kicker?: string;
                    note?: string;
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @description Null when the task has no hierarchy to draw */
                            svg: string | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Slack and Discord webhooks of a board and which events they announce (owner or admin) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardIntegrations"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Change the webhooks and notification switches of a board (owner or admin) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slackWebhookUrl?: string | null;
                        discordWebhookUrl?: string | null;
                        notifyOnTaskCreated?: boolean;
                        notifyOnTaskCompleted?: boolean;
                        notifyOnTaskMoved?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardIntegrations"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The owner, the members and, for those who manage the board, its pending invitations */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardPeople"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/members/{memberId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove a member (owner or admin); says whether they still have access some other way */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            /** @description The role the person keeps through the organization or a team, if any */
                            remainingRole: string | null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Change a member's role (owner or admin) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        role: "admin" | "member" | "viewer";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            role: string;
                            user: {
                                name: string | null;
                                email: string;
                            };
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/organizations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's organizations, with their boards and counts */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MyOrganization"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create an organization; the caller becomes its owner */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        description?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Organization"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The members of an organization (any member can read them) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["OrganizationMember"][];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Add someone who already has an account, or change their role (organization owner or admin) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        email: string;
                        /** @enum {string} */
                        role: "admin" | "member";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Membership"];
                    };
                };
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Membership"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Remove a member from the organization and from its teams (organization owner or admin) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        userId: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Change a member's role (organization owner or admin) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        userId: string;
                        /** @enum {string} */
                        role: "admin" | "member";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Membership"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/organizations/{organizationId}/available-members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** People the caller shares an organization with who are not in this one yet (organization owner or admin) */
        get: {
            parameters: {
                query?: {
                    q?: string;
                };
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AvailableMember"][];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/members/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add several people who already have accounts (organization owner or admin) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        emails: string[];
                        /** @enum {string} */
                        role: "admin" | "member";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BatchAddMembersResult"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Pending invitations for this organization and for its boards (owner or admin). Keeps Members and Board members in sync. */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PendingOrganizationInvitation"][];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Invite someone to the organization by email (owner or admin); the invitation lasts 7 days */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        email: string;
                        /**
                         * @default member
                         * @enum {string}
                         */
                        role?: "admin" | "member";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PendingOrganizationInvitation"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/invitations/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Invite several people by email (owner or admin); each invitation lasts 7 days */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        emails: string[];
                        /**
                         * @default member
                         * @enum {string}
                         */
                        role?: "admin" | "member";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BatchInviteResult"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/invitations/{invitationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke a pending organization invitation or a pending board invitation for a board in this organization (owner or admin) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/teams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The teams of an organization with their members and board grants (any member of the organization) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TeamDetail"][];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create a team (any member of the organization); a name can be used once per organization */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Team"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/teams/{teamId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add an organization member to a team (organization owner or admin) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    teamId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        userId: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TeamMember"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Remove someone from a team (organization owner or admin) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    teamId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        userId: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/teams/{teamId}/boards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Give a team a role on a board of the same organization, or change it (organization owner or admin) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    teamId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        boardId: string;
                        /** @enum {string} */
                        role: "admin" | "member" | "viewer";
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BoardTeamGrant"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Take a team's access to a board away (organization owner or admin) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    teamId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        boardId: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Save the order of tickets and the list each one is in, after a drag (editors of the board) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        items: {
                            id: string;
                            order: number;
                            listId: string;
                        }[];
                        movedTaskId?: string | null;
                        fromListId?: string | null;
                        toListId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/boards/{boardId}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The board's open tickets (id, title, status, list) and its epics, for pickers */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            tasks: {
                                id: string;
                                title: string;
                                completed: boolean;
                                listTitle: string;
                            }[];
                            epics: {
                                id: string;
                                title: string;
                                color: string;
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a ticket (editors of the board) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Change a ticket; only the fields sent change (editors of the board) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title?: string;
                        description?: string | null;
                        completed?: boolean;
                        startDate?: string | null;
                        dueDate?: string | null;
                        priority?: ("urgent" | "high" | "medium" | "low") | null;
                        epicId?: string | null;
                        quarter?: string | null;
                        archived?: boolean;
                        assigneeId?: string | null;
                        qaId?: string | null;
                        reporterId?: string | null;
                        listId?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TaskDetail"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/tasks/{taskId}/labels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Put a label on the ticket, or take it off if it already has it (editors of the board) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        labelId: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            active: boolean;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a ticket at the end of a list; editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                        listId: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatedTask"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/tasks/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create up to 100 tickets at once (Brain Dump), each at the end of its list; editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        tasks: {
                            title: string;
                            description?: string | null;
                            /** @description urgent, high, medium or low; anything else becomes medium */
                            priority?: string | null;
                            /** @description A date; one that cannot be read is ignored */
                            dueDate?: string | null;
                            /** @description A date; one that cannot be read is ignored */
                            startDate?: string | null;
                            /** @description e.g. 2026-Q4 */
                            quarter?: string | null;
                            listId: string;
                            epicId?: string | null;
                            subtasks?: {
                                title: string;
                            }[] | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            count: number;
                            tasks: components["schemas"]["CreatedTask"][];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/assignee": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Assign the ticket to someone, or clear it if they already are (editors; members only if the board allows) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        assigneeId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            assigneeId: string | null;
                            assignee: {
                                id: string;
                                name: string | null;
                                email: string;
                            } | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/qa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set the ticket's QA, or clear it if they already are (editors; members only if the board allows) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        qaId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            qaId: string | null;
                            qa: {
                                id: string;
                                name: string | null;
                                email: string;
                            } | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/reporter": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set the ticket's reporter, or clear it if they already are (editors; members only if the board allows) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reporterId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            reporterId: string | null;
                            reporter: {
                                id: string;
                                name: string | null;
                                email: string;
                            } | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/collaborators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add a collaborator to the ticket, or remove them if they already are (editors; members only if the board allows) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        collaboratorId?: string;
                        userId?: string;
                        assigneeId?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            active: boolean;
                            userId: string;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/subtasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The ticket's checklist, in order */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Subtask"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Add an item to the checklist (editors of the board) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Subtask"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/subtasks/{subtaskId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove an item from the checklist (editors of the board) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                    subtaskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            ok: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Rename an item or tick it (editors of the board) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                    subtaskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title?: string;
                        completed?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Subtask"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/tasks/{taskId}/custom-values": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The board's enabled custom fields and this ticket's values */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            fields: components["schemas"]["CustomField"][];
                            values: components["schemas"]["CustomFieldValue"][];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Set a custom field's value on the ticket (editors of the board); parent and child links are kept in step on both tickets */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        customFieldId: string;
                        value?: string | number | boolean | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CustomFieldValue"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/tasks/{taskId}/share": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Whether the ticket has a public link, and which */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @description The secret of the public link; null while the ticket is not shared */
                            shareToken: string | null;
                            shareUrl: string | null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Switch the public link on (it keeps the same token if it already had one); editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @description The secret of the public link; null while the ticket is not shared */
                            shareToken: string | null;
                            shareUrl: string | null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Switch the public link off (editors of the board) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/agent-apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply the changes Kiki suggested in one of its comments; editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        commentId: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            ok: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/agent-undo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Undo a change Kiki made on this ticket; editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        changeId: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            ok: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/ai/parse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Turn a free-form text into tickets (Brain Dump), with the caller's own AI key */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        text: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            tasks: components["schemas"]["ParsedTask"][];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/ai/improve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rewrite a ticket's title and description and suggest subtasks, with the caller's own AI key */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        title?: string;
                        description?: string;
                        /** @enum {string} */
                        descriptionLanguage?: "en" | "es" | "tl";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            title: string;
                            description: string;
                            suggestedSubtasks: {
                                title: string;
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/ai/transcribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Transcribe an audio recording (multipart `file`, optional `language`), with the caller's own AI key */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            text: string;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The GitHub account, repository and branch an organization linked, and the state of an install in progress */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            configured: boolean;
                            connection: components["schemas"]["GithubConnection"] | null;
                            pendingApproval: boolean;
                            choices: {
                                installationId: string;
                                accountLogin: string;
                                /** @enum {string} */
                                accountType: "Organization" | "User";
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Uninstall the GitHub App from the linked account and forget the connection */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            connection: null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Choose the repository and branch; GitHub confirms both exist for the installation */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        repositoryId?: string;
                        branch?: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            connection: components["schemas"]["GithubConnection"] | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github/repositories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The repositories the installation can see */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            repositories: {
                                id: string;
                                fullName: string;
                                defaultBranch: string;
                            }[];
                            truncated: boolean;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github/branches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The branches of one repository of the installation */
        get: {
            parameters: {
                query?: {
                    repositoryId?: string;
                };
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            branches: string[];
                            truncated: boolean;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github/install": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start installing the GitHub App; answers the GitHub address to send the browser to */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            url: string;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** After the owner approved a requested install: the GitHub address that proves who may claim it */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            url: string;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/github/choose": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Pick one of the GitHub accounts the person's own authorization could see */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        installationId?: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            connection: components["schemas"]["GithubConnection"] | null;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/github/setup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Where to send the browser GitHub redirected to the setup page: sign in, GitHub again, or back to the organizations page */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        state?: string | null;
                        installationId?: string | null;
                        setupAction?: string | null;
                        code?: string | null;
                        error?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            kind: "sign-in";
                        } | {
                            /** @enum {string} */
                            kind: "external";
                            url: string;
                        } | {
                            /** @enum {string} */
                            kind: "redirect";
                            outcome: string;
                            organizationId: string | null;
                            resultToken: string | null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/github/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What the one-time result of a setup says, without consuming it, for the organizations page to render */
        get: {
            parameters: {
                query?: never;
                header: {
                    "x-github-result-token": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            result: {
                                /** @enum {string} */
                                outcome: "connected" | "error" | "requested" | "updated" | "waiting" | "choose";
                                organizationId: string | null;
                            } | null;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Consume the one-time result of a setup, so the organizations page shows it once */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        token: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/development": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The branch name and checkout command of a ticket, and the branches on GitHub that carry its key */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            connected: boolean;
                            ticketKey: string;
                            suggestedBranch: string;
                            command: string | null;
                            repositoryName: string | null;
                            baseBranch: string | null;
                            branches: {
                                name: string;
                                url: string;
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/github": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** GitHub's webhook: an uninstalled app or a removed repository clears the organization's link */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            received: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/security": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's two-factor methods */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SecuritySettings"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Turn a two-factor method on or off, or send / verify its code (`action`) */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        action?: string;
                        code?: string;
                        phone?: string;
                    } | null;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SecuritySettings"] | {
                            /** @enum {boolean} */
                            ok: true;
                            email: string;
                            phone?: string;
                        } | {
                            secret: string;
                            qr: string;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/ai": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's AI provider settings (the key comes back masked) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AiSettings"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Save the caller's AI provider, key, model and address; a masked or missing key keeps the stored one */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        provider?: ("openai" | "claude" | "gemini" | "grok" | "deepseek" | "kimi" | "custom") | null;
                        apiKey?: string | null;
                        model?: string | null;
                        baseUrl?: string | null;
                        voiceLanguage?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            provider: string;
                            hasApiKey: boolean;
                            /** @description The key with its middle hidden; the key itself is never sent back */
                            maskedApiKey: string;
                            model: string | null;
                            baseUrl: string | null;
                            voiceLanguage: string;
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/appearance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The caller's appearance preferences */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Appearance"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Save the caller's appearance; what is sent is normalised against closed lists, never stored as it arrives */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": unknown;
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Appearance"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/custom-fields/boards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The boards the caller can read, with whether they administer each (to pick one in Settings) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            title: string;
                            color: string | null;
                            isOwner: boolean;
                            isAdmin: boolean;
                        }[];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/custom-fields": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** A board's custom fields; editors get the default ones created first */
        get: {
            parameters: {
                query: {
                    boardId: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            customFields: components["schemas"]["CustomField"][];
                            isAdmin: boolean;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create a custom field on a board; administrators only */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        boardId?: string;
                        name?: string;
                        type?: string;
                        options?: string[] | null;
                        enabled?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CustomField"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/custom-fields/{fieldId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a custom field and its values; administrators only, and never a default one */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    fieldId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Edit a custom field; administrators only */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    fieldId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                        type?: string;
                        options?: string[] | null;
                        enabled?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CustomField"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/v1/tasks/{taskId}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The ticket's attachments, oldest first */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Attachment"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Attach a file (multipart field `file`, up to 25 MB); editors of the board */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Attachment"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/attachments/{attachmentId}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The file itself. Images, PDFs and plain text open in the tab; anything else downloads */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                    attachmentId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/attachments/{attachmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove an attachment and its file; editors of the board */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                    attachmentId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** The ticket's comments, oldest first, with Kiki's suggestions and changes */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Comment"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Add a comment; editors of the board. People it mentions and the ticket's people are notified; @Kiki makes Kiki answer */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        content: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Comment"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tasks/{taskId}/comments/{commentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a comment (its author, or whoever administers the board) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    taskId: string;
                    commentId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Invite someone to a board by email (owner or admin); the invitation lasts 7 days */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        email: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PendingInvitation"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/invitations/{invitationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke an invitation of this board (owner only) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invitations/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** What an invitation link is for: the address, the board or organization, and whether it can still be used */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    token: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InvitationPreview"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invitations/{token}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Accept an invitation: joins the board (and its organization) or the organization alone */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    token: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["InvitationAccept"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                410: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/external-access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Active external access tokens of a board (owner or admin) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExternalAccessToken"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create an external access token for a board (owner or admin); the token is shown once */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        /** @enum {string} */
                        access?: "read" | "write";
                        /** @description A future date, or empty for a token that does not expire */
                        expiresAt?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatedExternalAccessToken"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/external-access/{tokenId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke a board's external access token (owner or admin) */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    boardId: string;
                    tokenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/external-access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Active organization-wide external access tokens (organization owner or admin) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ExternalAccessToken"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create an organization-wide external access token; the token is shown once */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        /** @enum {string} */
                        access?: "read" | "write";
                        /** @description A future date, or empty for a token that does not expire */
                        expiresAt?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatedExternalAccessToken"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/organizations/{organizationId}/external-access/{tokenId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke an organization-wide external access token */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    organizationId: string;
                    tokenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/mcp/tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Active external-access tokens created by the caller */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PersonalExternalAccessToken"][];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Create a personal MCP token for every board the caller can open; rights follow app role; shown once */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        /** @enum {string} */
                        access?: "read" | "write";
                        /** @description A future date, or empty for a token that does not expire */
                        expiresAt?: string | null;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatedPersonalExternalAccessToken"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        /** Revoke an external-access token the caller created */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        id: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Delivery velocity, achieved story points per user, burndown, and cycle/lead time metrics */
        get: {
            parameters: {
                query?: {
                    startDate?: string;
                    endDate?: string;
                    groupBy?: "day" | "week" | "month";
                    userId?: string;
                    allocationPolicy?: "primary" | "split";
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            boardId: string;
                            dateRange: {
                                startDate: string | null;
                                endDate: string | null;
                            };
                            totals: {
                                plannedPoints: number;
                                achievedPoints: number;
                                remainingPoints: number;
                                completionRate: number;
                                totalTasks: number;
                                completedTasks: number;
                            };
                            achievedByUser: {
                                userId: string | null;
                                userName: string | null;
                                userEmail: string | null;
                                achievedPoints: number;
                                completedTasks: number;
                                buckets: {
                                    periodKey: string;
                                    periodStart: string;
                                    periodEnd: string;
                                    points: number;
                                    tasks: number;
                                }[];
                            }[];
                            velocity: {
                                /** @enum {string} */
                                interval: "day" | "week" | "month";
                                totalPlannedPoints: number;
                                totalAchievedPoints: number;
                                totalCompletedTasks: number;
                                buckets: {
                                    periodKey: string;
                                    periodStart: string;
                                    periodEnd: string;
                                    achievedPoints: number;
                                    completedTasks: number;
                                    cumulativePoints: number;
                                    remainingPoints: number;
                                    byUser: {
                                        userId: string | null;
                                        userName: string | null;
                                        points: number;
                                        tasks: number;
                                    }[];
                                }[];
                            };
                            cycleAndLeadTime: {
                                leadTime: {
                                    averageMs: number | null;
                                    medianMs: number | null;
                                    p85Ms: number | null;
                                    sampleSize: number;
                                };
                                cycleTime: {
                                    averageMs: number | null;
                                    medianMs: number | null;
                                    p85Ms: number | null;
                                    sampleSize: number;
                                };
                                dwellByList: {
                                    listId: string;
                                    listTitle: string;
                                    transitionCount: number;
                                    averageDwellMs: number;
                                    medianDwellMs: number;
                                    totalDwellMs: number;
                                    isBottleneck: boolean;
                                }[];
                                bottleneckListId: string | null;
                                bottleneckListTitle: string | null;
                            };
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/state-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Immutable workflow state transition history for a board or specific ticket */
        get: {
            parameters: {
                query?: {
                    taskId?: string;
                    startDate?: string;
                    endDate?: string;
                    limit?: number;
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            transitions: {
                                id: string;
                                taskId: string;
                                taskTitle: string | null;
                                boardId: string;
                                fromListId: string | null;
                                fromListTitle: string | null;
                                toListId: string;
                                toListTitle: string;
                                movedById: string | null;
                                movedByName: string | null;
                                assigneeIdAtMove: string | null;
                                assigneeNameAtMove: string | null;
                                storyPointsAtMove: number | null;
                                completedAfterMove: boolean;
                                durationMs: number | null;
                                transitionedAt: string;
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/boards/{boardId}/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Immutable ISO 27001 A.8.15/A.8.16 security & administrative audit log entries for a board */
        get: {
            parameters: {
                query?: {
                    action?: string;
                    actorId?: string;
                    entityType?: string;
                    startDate?: string;
                    endDate?: string;
                    limit?: number;
                };
                header?: never;
                path: {
                    boardId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            boardId: string;
                            auditLogs: {
                                id: string;
                                boardId: string | null;
                                organizationId: string | null;
                                actorId: string | null;
                                actorEmail: string | null;
                                ipAddress: string | null;
                                userAgent: string | null;
                                action: string;
                                entityType: string;
                                entityId: string | null;
                                beforeState: unknown;
                                afterState: unknown;
                                createdAt: string;
                            }[];
                        };
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/legal/consents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List recorded legal consent history and latest status per consent type for the caller */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ListLegalConsentsResponse"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        /** Record append-only proof of legal consent acceptance for the authenticated caller */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        consents: {
                            /** @enum {string} */
                            consentType: "terms" | "privacy" | "marketing_email" | "cookies";
                            granted: boolean;
                            documentVersion: string;
                            checkboxText: string;
                            /** @enum {string} */
                            source: "sign_up" | "cookie_banner" | "settings" | "oauth_onboarding";
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RecordLegalConsentsResponse"];
                    };
                };
                /** @description Default Response */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/legal/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Self-serve DSAR export of the authenticated caller's personal data (excludes secrets and credentials) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DsarExportResponse"];
                    };
                };
                /** @description Default Response */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorInput: {
            /** @description Stable machine-readable code, e.g. unauthorized or not_found */
            error: string;
            /** @description Human-readable explanation */
            message: string;
        };
        BoardAccessInput: {
            /** @description organization or restricted */
            accessMode: string;
            /** @description viewer or member */
            defaultRole: string;
            /** @description off, owner or member */
            kikiMode: string;
            kikiTriage: boolean;
            organization: {
                id: string;
                name: string;
                teams: {
                    id: string;
                    name: string;
                }[];
            };
            teamAccess: {
                teamId: string;
                role: string;
            }[];
            /** @description Whether the caller manages the board's organization */
            canCreateTeam: boolean;
        };
        ParsedTaskInput: {
            title: string;
            description: string;
            /** @description urgent, high, medium or low */
            priority: string;
            dueDate?: string | null;
            startDate?: string | null;
            quarter?: string | null;
            subtasks: {
                title: string;
            }[];
            suggestedList?: string | null;
        };
        GithubConnectionInput: {
            accountLogin: string;
            /** @enum {string} */
            accountType: "Organization" | "User";
            repositoryId: string | null;
            repositoryName: string | null;
            branch: string | null;
            /** @description Where the installation is managed on GitHub; only owners and admins get it */
            settingsUrl?: string;
        };
        LabelInput: {
            id: string;
            title: string;
            /** @description CSS colour, e.g. #ef4444 */
            color: string;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ArchivedTaskInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            priority: string | null;
            quarter: string | null;
            archivedAt: string | null;
            listId: string;
            list: {
                id: string;
                title: string;
            };
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            labels: components["schemas"]["LabelInput"][];
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        AttachmentInput: {
            id: string;
            taskId: string;
            filename: string;
            /** @description Bytes */
            size: number;
            /** @description ISO 8601 date-time */
            createdAt: string;
        };
        ListInput: {
            id: string;
            title: string;
            order: number;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        BoardLinkInput: {
            id: string;
            label: string;
            url: string;
        };
        BoardInput: {
            id: string;
            title: string;
            description: string | null;
            color: string | null;
            links: components["schemas"]["BoardLinkInput"][] | null;
            memberCanAssign: boolean;
            /** @description off, owner or member */
            kikiMode: string;
            kikiTriage: boolean;
            /** @description organization or restricted */
            accessMode: string;
            /** @description viewer or member */
            defaultRole: string;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
            /** @description The owner */
            userId: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ActivityReferenceInput: {
            taskId: string;
            ticketKey: string | null;
            title: string;
            url: string;
        };
        ActivityLogInput: {
            id: string;
            type: string;
            /** @description JSON {"k": translation key, "p": params, optional "r": ticket ref stubs}; the frontend translates it */
            message: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            references: components["schemas"]["ActivityReferenceInput"][];
        };
        EpicProgressInput: {
            id: string;
            title: string;
            description: string | null;
            /** @description CSS colour, e.g. #3b82f6 */
            color: string;
            /** @description e.g. 2026-Q1 */
            quarter: string | null;
            /** @description open or completed */
            status: string;
            totalTasks: number;
            completedTasks: number;
            /** @description Percentage of active tasks completed, 0 to 100 */
            progress: number;
        };
        EpicInput: {
            id: string;
            title: string;
            description: string | null;
            color: string;
            quarter: string | null;
            /** @description open or completed */
            status: string;
            order: number;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        TaskInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreatedTaskInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** @description Handed out once, in creation order on the board */
            number: number;
        };
        TaskDetailInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            list: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
            epic: components["schemas"]["EpicInput"] | null;
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["LabelInput"];
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            reporter: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
        };
        SubtaskInput: {
            id: string;
            title: string;
            completed: boolean;
            order: number;
            taskId: string;
            /** Format: date-time */
            createdAt: string;
        };
        CustomFieldInput: {
            id: string;
            boardId: string;
            name: string;
            /** @description NUMBER, TEXT or SELECT */
            type: string;
            /** @description The choices of a SELECT field */
            options: string[] | null;
            enabled: boolean;
            isDefault: boolean;
            /** @description story_points, environment, parent, child or customer */
            defaultKey: string | null;
            order: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CustomFieldValueInput: {
            id: string;
            taskId: string;
            customFieldId: string;
            value: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            customField: components["schemas"]["CustomFieldInput"];
        };
        CommentInput: {
            id: string;
            content: string;
            taskId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            user: {
                name: string | null;
                email: string;
                isAgent: boolean;
            };
            /** @description A triage suggestion from Kiki, and whether it is still to be applied */
            suggestion: {
                pending: boolean;
            } | null;
            /** @description A change Kiki applied with this comment, and whether it was undone */
            change: {
                id: string;
                reverted: boolean;
            } | null;
        };
        BoardCardInput: {
            id: string;
            title: string;
            color: string | null;
            /** Format: date-time */
            updatedAt: string;
            isOwner: boolean;
            totalTasks: number;
            completedTasks: number;
            totalLists: number;
        };
        WorkspaceInput: {
            userId: string;
            /** @description The caller's appearance preferences, normalised */
            appearance: unknown;
            boards: {
                id: string;
                title: string;
                description: string | null;
                color: string | null;
                links: components["schemas"]["BoardLinkInput"][] | null;
                memberCanAssign: boolean;
                /** @description off, owner or member */
                kikiMode: string;
                kikiTriage: boolean;
                /** @description organization or restricted */
                accessMode: string;
                /** @description viewer or member */
                defaultRole: string;
                notifyOnTaskCreated: boolean;
                notifyOnTaskCompleted: boolean;
                notifyOnTaskMoved: boolean;
                /** @description The owner */
                userId: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                organization: {
                    id: string;
                    name: string;
                } | null;
            }[];
        };
        BoardViewTaskInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            number: number;
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["LabelInput"];
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            reporter: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            subtasks: {
                completed: boolean;
            }[];
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            customValues: {
                id: string;
                taskId: string;
                customFieldId: string;
                value: string | null;
                customField: {
                    id: string;
                    name: string;
                    type: string;
                    options: unknown | null;
                    enabled: boolean;
                    isDefault: boolean;
                    defaultKey: string | null;
                    order: number;
                };
            }[];
            _count: {
                comments: number;
                attachments: number;
            };
        };
        BoardViewInput: {
            board: {
                id: string;
                title: string;
                description: string | null;
                color: string | null;
                links: components["schemas"]["BoardLinkInput"][] | null;
                memberCanAssign: boolean;
                /** @description off, owner or member */
                kikiMode: string;
                kikiTriage: boolean;
                /** @description organization or restricted */
                accessMode: string;
                /** @description viewer or member */
                defaultRole: string;
                notifyOnTaskCreated: boolean;
                notifyOnTaskCompleted: boolean;
                notifyOnTaskMoved: boolean;
                /** @description The owner */
                userId: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                key: string;
                nextTicketNumber: number;
            };
            /** @description The owner and the members, each once: who can be assigned */
            people: {
                id: string;
                name: string | null;
                email: string;
            }[];
            lists: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                tasks: components["schemas"]["BoardViewTaskInput"][];
            }[];
            /** @description owner, admin, member or viewer */
            role: string;
            isOwner: boolean;
            canManage: boolean;
            canEdit: boolean;
            /** @description The tour was seen, or the board has no lists yet so there is nothing to show */
            tourSeen: boolean;
        };
        MyTaskInput: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            number: number;
            list: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["LabelInput"];
            }[];
            subtasks: {
                id: string;
                title: string;
                completed: boolean;
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            _count: {
                comments: number;
                attachments: number;
            };
        };
        MyTasksInput: {
            userId: string;
            boards: {
                id: string;
                title: string;
                color: string | null;
                list: {
                    id: string;
                    title: string;
                    order: number;
                }[];
            }[];
            tasks: components["schemas"]["MyTaskInput"][];
        };
        DashboardInput: {
            userId: string;
            userName: string | null;
            onboarding: {
                done: {
                    createBoard: boolean;
                    addList: boolean;
                    createTicket: boolean;
                    inviteTeammate: boolean;
                    connectAi: boolean;
                };
                completedCount: number;
                total: number;
                /** @description Every step is done: the card says goodbye by itself */
                isComplete: boolean;
                /** @description The person closed the card by hand */
                dismissed: boolean;
                tourSeen: boolean;
            };
            boards: components["schemas"]["BoardCardInput"][];
            totalTasks: number;
            totalPending: number;
            overdue: number;
            completedThisWeek: number;
            upcomingTasks: {
                id: string;
                title: string;
                completed: boolean;
                dueDate: string | null;
                priority: string | null;
                list: {
                    title: string;
                    board: {
                        id: string;
                        title: string;
                    };
                };
            }[];
            recentActivity: {
                id: string;
                boardId: string;
                userId: string;
                type: string;
                message: string;
                /** Format: date-time */
                createdAt: string;
                board: {
                    id: string;
                    title: string;
                };
                user: {
                    name: string | null;
                };
                references: {
                    taskId: string;
                    ticketKey: string | null;
                    title: string;
                    url: string;
                }[];
            }[];
            assignedTasks: {
                id: string;
                title: string;
                completed: boolean;
                priority: string | null;
                dueDate: string | null;
                quarter: string | null;
                assigneeId: string | null;
                qaId: string | null;
                collaborators: {
                    userId: string;
                }[];
                epic: {
                    id: string;
                    title: string;
                    color: string;
                } | null;
                _count: {
                    comments: number;
                    attachments: number;
                };
                subtasks: {
                    id: string;
                    completed: boolean;
                }[];
                list: {
                    id: string;
                    title: string;
                    board: {
                        id: string;
                        title: string;
                        list: {
                            id: string;
                            title: string;
                            order: number;
                        }[];
                    };
                };
            }[];
            /** @description When each ticket the caller completed in the last 7 days was completed */
            completedLast7: string[];
            priorityCounts: {
                urgent: number;
                high: number;
                medium: number;
                low: number;
                none: number;
            };
        };
        SharedTaskInput: {
            title: string;
            description: string | null;
            completed: boolean;
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            quarter: string | null;
            list: {
                title: string;
                board: {
                    title: string;
                };
            };
            epic: {
                title: string;
                color: string;
            } | null;
            labels: {
                label: {
                    id: string;
                    title: string;
                    color: string;
                };
            }[];
            subtasks: {
                id: string;
                title: string;
                completed: boolean;
            }[];
            attachments: {
                id: string;
                filename: string;
                url: string;
                size: number;
            }[];
            comments: {
                id: string;
                content: string;
                /** Format: date-time */
                createdAt: string;
                user: {
                    name: string | null;
                };
            }[];
        };
        BoardQuarterInput: {
            id: string;
            /** @description Quarter label, e.g. "2026-Q1" */
            key: string;
            /** Format: date-time */
            startDate: string;
            /** Format: date-time */
            endDate: string;
        };
        BoardMemberInput: {
            id: string;
            /** @description admin, member or viewer */
            role: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            user: {
                name: string | null;
                email: string;
            };
        };
        PendingInvitationInput: {
            id: string;
            email: string;
            status: string;
            /** Format: date-time */
            expiresAt: string;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /**
             * @description Where the invite was created
             * @enum {string}
             */
            source: "board" | "organization";
            /** @description Set when source is organization */
            organizationId: string | null;
        };
        BoardPeopleInput: {
            owner: {
                name: string | null;
                email: string;
                id: string;
            };
            members: components["schemas"]["BoardMemberInput"][];
            /** @description Only for those who manage the board */
            invitations: components["schemas"]["PendingInvitationInput"][];
            isOwner: boolean;
            canManage: boolean;
            /** @description The caller's role: owner, admin, member or viewer */
            role: string;
        };
        ExternalAccessTokenInput: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        CreatedExternalAccessTokenInput: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** @description The plaintext token. It is shown this once and cannot be read again. */
            token: string;
        };
        PersonalExternalAccessTokenInput: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            fullAccess: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            board: {
                id: string;
                title: string;
            } | null;
        };
        CreatedPersonalExternalAccessTokenInput: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            fullAccess: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            board: {
                id: string;
                title: string;
            } | null;
            /** @description The plaintext token. It is shown this once and cannot be read again. */
            token: string;
        };
        InvitationPreviewInput: {
            /** @description The address the invitation was sent to */
            email: string;
            /**
             * @description Whether this invite is for a board or an organization
             * @enum {string}
             */
            kind: "board" | "organization";
            boardTitle: string | null;
            organizationName: string | null;
            /** @description For organization invites: admin or member */
            role: string | null;
            /** @description pending, accepted or revoked */
            status: string;
            expired: boolean;
        };
        InvitationAcceptInput: {
            boardId?: string;
            organizationId?: string;
        };
        BoardIntegrationsInput: {
            slackWebhookUrl: string | null;
            discordWebhookUrl: string | null;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
        };
        LegalConsentEntryInput: {
            id: string;
            consentType: string;
            granted: boolean;
            documentVersion: string;
            checkboxText: string;
            source: string;
            ipAddress: string | null;
            userAgent: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        RecordLegalConsentsResponseInput: {
            recorded: number;
            consents: components["schemas"]["LegalConsentEntryInput"][];
        };
        ListLegalConsentsResponseInput: {
            consents: components["schemas"]["LegalConsentEntryInput"][];
            latestByType: {
                [key: string]: {
                    granted: boolean;
                    documentVersion: string;
                    /** Format: date-time */
                    createdAt: string;
                };
            };
        };
        DsarExportResponseInput: {
            /** Format: date-time */
            exportedAt: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                createdAt: string | null;
                updatedAt: string | null;
            };
            settings: {
                aiProvider: string;
                aiModel: string | null;
                aiBaseUrl: string | null;
                voiceLanguage: string;
                onboardingDismissedAt: string | null;
                tourSeenAt: string | null;
                appearance: unknown | null;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            } | null;
            mfa: {
                emailEnabled: boolean;
                phoneEnabled: boolean;
                totpEnabled: boolean;
                phone: string | null;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            } | null;
            ownedBoards: {
                id: string;
                title: string;
                description: string | null;
                key: string;
                accessMode: string;
                defaultRole: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            }[];
            boardMemberships: {
                boardId: string;
                role: string;
                /** Format: date-time */
                createdAt: string;
            }[];
            organizationMemberships: {
                organizationId: string;
                role: string;
                /** Format: date-time */
                createdAt: string;
            }[];
            comments: {
                id: string;
                taskId: string;
                content: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            }[];
            notifications: {
                id: string;
                type: string;
                message: string;
                read: boolean;
                boardId: string | null;
                taskId: string | null;
                /** Format: date-time */
                createdAt: string;
            }[];
            legalConsentLogs: components["schemas"]["LegalConsentEntryInput"][];
        };
        NotificationInput: {
            id: string;
            /** @description assigned or comment */
            type: string;
            message: string;
            read: boolean;
            userId: string;
            boardId: string | null;
            taskId: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        OrganizationInput: {
            id: string;
            name: string;
            description: string | null;
            createdById: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        MyOrganizationInput: {
            id: string;
            name: string;
            description: string | null;
            /** @description The caller's role: owner, admin or member */
            role: string;
            boards: {
                id: string;
                title: string;
                color: string | null;
                /** @description The caller owns the board, so they can move it to another organization */
                canMove: boolean;
                /** @description The caller can create an external access token for the board */
                canIssueToken: boolean;
            }[];
            _count: {
                boards: number;
                members: number;
                teams: number;
            };
        };
        OrganizationMemberInput: {
            role: string;
            /** Format: date-time */
            createdAt: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        };
        MembershipInput: {
            organizationId: string;
            userId: string;
            role: string;
            /** Format: date-time */
            createdAt: string;
        };
        AvailableMemberInput: {
            id: string;
            name: string | null;
            email: string;
            /** @description The organizations the caller shares with them */
            organizations: {
                id: string;
                name: string;
            }[];
        };
        PendingOrganizationInvitationInput: {
            id: string;
            email: string;
            status: string;
            /** @description admin or member (board-sourced rows use member) */
            role: string;
            /** Format: date-time */
            expiresAt: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /**
             * @description Where the invite was created
             * @enum {string}
             */
            source: "organization" | "board";
            /** @description Set when source is board */
            boardId: string | null;
            /** @description Set when source is board */
            boardTitle: string | null;
        };
        BatchAddMembersResultInput: {
            added: components["schemas"]["MembershipInput"][];
            failed: {
                email: string;
                error: string;
                message: string;
            }[];
        };
        BatchInviteResultInput: {
            invited: components["schemas"]["PendingOrganizationInvitationInput"][];
            failed: {
                email: string;
                error: string;
                message: string;
            }[];
        };
        TeamInput: {
            id: string;
            name: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        TeamDetailInput: {
            id: string;
            name: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            members: {
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            boardAccess: {
                role: string;
                board: {
                    id: string;
                    title: string;
                };
            }[];
        };
        TeamMemberInput: {
            teamId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
        };
        BoardTeamGrantInput: {
            boardId: string;
            teamId: string;
            role: string;
            /** Format: date-time */
            createdAt: string;
        };
        CalendarTaskInput: {
            id: string;
            title: string;
            completed: boolean;
            dueDate: string | null;
            list: {
                title: string;
                boardId: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
        };
        McpConsentOptionsInput: {
            client: string;
            writeRequested: boolean;
            lockedSelection: string | null;
            organizations: {
                id: string;
                name: string;
            }[];
            boards: {
                id: string;
                title: string;
                organizationName: string;
            }[];
        };
        McpOAuthClientInput: {
            id: string;
            redirectUris: string[];
            allowWrite: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        CreatedMcpOAuthClientInput: {
            id: string;
            redirectUris: string[];
            allowWrite: boolean;
            /** Format: date-time */
            createdAt: string;
            /** @description Shown once */
            secret: string;
        };
        McpChangeInput: {
            id: string;
            boardId: string;
            kind: string;
            summary: string;
            /** Format: date-time */
            createdAt: string;
            revertedAt: string | null;
            revertsChangeId: string | null;
        };
        McpChangeDetailInput: {
            id: string;
            kind: string;
            summary: string;
            boardId: string;
            revertedAt: string | null;
            before: unknown[];
            after: unknown[];
            listNames: {
                [key: string]: string;
            };
            userNames: {
                [key: string]: string;
            };
            labelNames: {
                [key: string]: string;
            };
            epicNames: {
                [key: string]: string;
            };
            customFieldNames: {
                [key: string]: string;
            };
        };
        SearchResultInput: {
            boards: {
                id: string;
                title: string;
                color: string | null;
            }[];
            tasks: {
                id: string;
                title: string;
                completed: boolean;
                list: {
                    title: string;
                    boardId: string;
                    board: {
                        title: string;
                    };
                };
            }[];
        };
        SecuritySettingsInput: {
            email: string;
            emailEnabled: boolean;
            phone: string | null;
            phoneEnabled: boolean;
            totpEnabled: boolean;
        };
        AiSettingsInput: {
            provider: string;
            hasApiKey: boolean;
            /** @description The key with its middle hidden; the key itself is never sent back */
            maskedApiKey: string;
            /** @description Empty means the app's default model */
            model: string;
            baseUrl: string;
            voiceLanguage: string;
        };
        AppearanceInput: {
            mode: string;
            accent: string;
            density: string;
            style: string;
            gradients: boolean;
            card: {
                [key: string]: boolean;
            };
        };
        Error: {
            /** @description Stable machine-readable code, e.g. unauthorized or not_found */
            error: string;
            /** @description Human-readable explanation */
            message: string;
        };
        BoardAccess: {
            /** @description organization or restricted */
            accessMode: string;
            /** @description viewer or member */
            defaultRole: string;
            /** @description off, owner or member */
            kikiMode: string;
            kikiTriage: boolean;
            organization: {
                id: string;
                name: string;
                teams: {
                    id: string;
                    name: string;
                }[];
            };
            teamAccess: {
                teamId: string;
                role: string;
            }[];
            /** @description Whether the caller manages the board's organization */
            canCreateTeam: boolean;
        };
        ParsedTask: {
            title: string;
            description: string;
            /** @description urgent, high, medium or low */
            priority: string;
            dueDate?: string | null;
            startDate?: string | null;
            quarter?: string | null;
            subtasks: {
                title: string;
            }[];
            suggestedList?: string | null;
        };
        GithubConnection: {
            accountLogin: string;
            /** @enum {string} */
            accountType: "Organization" | "User";
            repositoryId: string | null;
            repositoryName: string | null;
            branch: string | null;
            /** @description Where the installation is managed on GitHub; only owners and admins get it */
            settingsUrl?: string;
        };
        Label: {
            id: string;
            title: string;
            /** @description CSS colour, e.g. #ef4444 */
            color: string;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ArchivedTask: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            priority: string | null;
            quarter: string | null;
            archivedAt: string | null;
            listId: string;
            list: {
                id: string;
                title: string;
            };
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            labels: components["schemas"]["Label"][];
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        Attachment: {
            id: string;
            taskId: string;
            filename: string;
            /** @description Bytes */
            size: number;
            /** @description ISO 8601 date-time */
            createdAt: string;
        };
        List: {
            id: string;
            title: string;
            order: number;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        BoardLink: {
            id: string;
            label: string;
            url: string;
        };
        Board: {
            id: string;
            title: string;
            description: string | null;
            color: string | null;
            links: components["schemas"]["BoardLink"][] | null;
            memberCanAssign: boolean;
            /** @description off, owner or member */
            kikiMode: string;
            kikiTriage: boolean;
            /** @description organization or restricted */
            accessMode: string;
            /** @description viewer or member */
            defaultRole: string;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
            /** @description The owner */
            userId: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ActivityReference: {
            taskId: string;
            ticketKey: string | null;
            title: string;
            url: string;
        };
        ActivityLog: {
            id: string;
            type: string;
            /** @description JSON {"k": translation key, "p": params, optional "r": ticket ref stubs}; the frontend translates it */
            message: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            references: components["schemas"]["ActivityReference"][];
        };
        EpicProgress: {
            id: string;
            title: string;
            description: string | null;
            /** @description CSS colour, e.g. #3b82f6 */
            color: string;
            /** @description e.g. 2026-Q1 */
            quarter: string | null;
            /** @description open or completed */
            status: string;
            totalTasks: number;
            completedTasks: number;
            /** @description Percentage of active tasks completed, 0 to 100 */
            progress: number;
        };
        Epic: {
            id: string;
            title: string;
            description: string | null;
            color: string;
            quarter: string | null;
            /** @description open or completed */
            status: string;
            order: number;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        Task: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreatedTask: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** @description Handed out once, in creation order on the board */
            number: number;
        };
        TaskDetail: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            list: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
            epic: components["schemas"]["Epic"] | null;
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["Label"];
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            reporter: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
        };
        Subtask: {
            id: string;
            title: string;
            completed: boolean;
            order: number;
            taskId: string;
            /** Format: date-time */
            createdAt: string;
        };
        CustomField: {
            id: string;
            boardId: string;
            name: string;
            /** @description NUMBER, TEXT or SELECT */
            type: string;
            /** @description The choices of a SELECT field */
            options: string[] | null;
            enabled: boolean;
            isDefault: boolean;
            /** @description story_points, environment, parent, child or customer */
            defaultKey: string | null;
            order: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CustomFieldValue: {
            id: string;
            taskId: string;
            customFieldId: string;
            value: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            customField: components["schemas"]["CustomField"];
        };
        Comment: {
            id: string;
            content: string;
            taskId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            user: {
                name: string | null;
                email: string;
                isAgent: boolean;
            };
            /** @description A triage suggestion from Kiki, and whether it is still to be applied */
            suggestion: {
                pending: boolean;
            } | null;
            /** @description A change Kiki applied with this comment, and whether it was undone */
            change: {
                id: string;
                reverted: boolean;
            } | null;
        };
        BoardCard: {
            id: string;
            title: string;
            color: string | null;
            /** Format: date-time */
            updatedAt: string;
            isOwner: boolean;
            totalTasks: number;
            completedTasks: number;
            totalLists: number;
        };
        Workspace: {
            userId: string;
            /** @description The caller's appearance preferences, normalised */
            appearance: unknown;
            boards: {
                id: string;
                title: string;
                description: string | null;
                color: string | null;
                links: components["schemas"]["BoardLink"][] | null;
                memberCanAssign: boolean;
                /** @description off, owner or member */
                kikiMode: string;
                kikiTriage: boolean;
                /** @description organization or restricted */
                accessMode: string;
                /** @description viewer or member */
                defaultRole: string;
                notifyOnTaskCreated: boolean;
                notifyOnTaskCompleted: boolean;
                notifyOnTaskMoved: boolean;
                /** @description The owner */
                userId: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                organization: {
                    id: string;
                    name: string;
                } | null;
            }[];
        };
        BoardViewTask: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            number: number;
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["Label"];
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            reporter: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            subtasks: {
                completed: boolean;
            }[];
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            customValues: {
                id: string;
                taskId: string;
                customFieldId: string;
                value: string | null;
                customField: {
                    id: string;
                    name: string;
                    type: string;
                    options: unknown | null;
                    enabled: boolean;
                    isDefault: boolean;
                    defaultKey: string | null;
                    order: number;
                };
            }[];
            _count: {
                comments: number;
                attachments: number;
            };
        };
        BoardView: {
            board: {
                id: string;
                title: string;
                description: string | null;
                color: string | null;
                links: components["schemas"]["BoardLink"][] | null;
                memberCanAssign: boolean;
                /** @description off, owner or member */
                kikiMode: string;
                kikiTriage: boolean;
                /** @description organization or restricted */
                accessMode: string;
                /** @description viewer or member */
                defaultRole: string;
                notifyOnTaskCreated: boolean;
                notifyOnTaskCompleted: boolean;
                notifyOnTaskMoved: boolean;
                /** @description The owner */
                userId: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                key: string;
                nextTicketNumber: number;
            };
            /** @description The owner and the members, each once: who can be assigned */
            people: {
                id: string;
                name: string | null;
                email: string;
            }[];
            lists: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                tasks: components["schemas"]["BoardViewTask"][];
            }[];
            /** @description owner, admin, member or viewer */
            role: string;
            isOwner: boolean;
            canManage: boolean;
            canEdit: boolean;
            /** @description The tour was seen, or the board has no lists yet so there is nothing to show */
            tourSeen: boolean;
        };
        MyTask: {
            id: string;
            title: string;
            description: string | null;
            completed: boolean;
            completedAt: string | null;
            completedById: string | null;
            /** @description urgent, high, medium or low */
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            archived: boolean;
            archivedAt: string | null;
            /** @description e.g. 2026-Q4 */
            quarter: string | null;
            epicId: string | null;
            order: number;
            listId: string;
            assigneeId: string | null;
            qaId: string | null;
            reporterId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            number: number;
            list: {
                id: string;
                title: string;
                order: number;
                boardId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
            labels: {
                taskId: string;
                labelId: string;
                label: components["schemas"]["Label"];
            }[];
            subtasks: {
                id: string;
                title: string;
                completed: boolean;
            }[];
            assignee: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            qa: {
                id: string;
                name: string | null;
                email: string;
            } | null;
            collaborators: {
                taskId: string;
                userId: string;
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            epic: {
                id: string;
                title: string;
                color: string;
            } | null;
            _count: {
                comments: number;
                attachments: number;
            };
        };
        MyTasks: {
            userId: string;
            boards: {
                id: string;
                title: string;
                color: string | null;
                list: {
                    id: string;
                    title: string;
                    order: number;
                }[];
            }[];
            tasks: components["schemas"]["MyTask"][];
        };
        Dashboard: {
            userId: string;
            userName: string | null;
            onboarding: {
                done: {
                    createBoard: boolean;
                    addList: boolean;
                    createTicket: boolean;
                    inviteTeammate: boolean;
                    connectAi: boolean;
                };
                completedCount: number;
                total: number;
                /** @description Every step is done: the card says goodbye by itself */
                isComplete: boolean;
                /** @description The person closed the card by hand */
                dismissed: boolean;
                tourSeen: boolean;
            };
            boards: components["schemas"]["BoardCard"][];
            totalTasks: number;
            totalPending: number;
            overdue: number;
            completedThisWeek: number;
            upcomingTasks: {
                id: string;
                title: string;
                completed: boolean;
                dueDate: string | null;
                priority: string | null;
                list: {
                    title: string;
                    board: {
                        id: string;
                        title: string;
                    };
                };
            }[];
            recentActivity: {
                id: string;
                boardId: string;
                userId: string;
                type: string;
                message: string;
                /** Format: date-time */
                createdAt: string;
                board: {
                    id: string;
                    title: string;
                };
                user: {
                    name: string | null;
                };
                references: {
                    taskId: string;
                    ticketKey: string | null;
                    title: string;
                    url: string;
                }[];
            }[];
            assignedTasks: {
                id: string;
                title: string;
                completed: boolean;
                priority: string | null;
                dueDate: string | null;
                quarter: string | null;
                assigneeId: string | null;
                qaId: string | null;
                collaborators: {
                    userId: string;
                }[];
                epic: {
                    id: string;
                    title: string;
                    color: string;
                } | null;
                _count: {
                    comments: number;
                    attachments: number;
                };
                subtasks: {
                    id: string;
                    completed: boolean;
                }[];
                list: {
                    id: string;
                    title: string;
                    board: {
                        id: string;
                        title: string;
                        list: {
                            id: string;
                            title: string;
                            order: number;
                        }[];
                    };
                };
            }[];
            /** @description When each ticket the caller completed in the last 7 days was completed */
            completedLast7: string[];
            priorityCounts: {
                urgent: number;
                high: number;
                medium: number;
                low: number;
                none: number;
            };
        };
        SharedTask: {
            title: string;
            description: string | null;
            completed: boolean;
            priority: string | null;
            startDate: string | null;
            dueDate: string | null;
            quarter: string | null;
            list: {
                title: string;
                board: {
                    title: string;
                };
            };
            epic: {
                title: string;
                color: string;
            } | null;
            labels: {
                label: {
                    id: string;
                    title: string;
                    color: string;
                };
            }[];
            subtasks: {
                id: string;
                title: string;
                completed: boolean;
            }[];
            attachments: {
                id: string;
                filename: string;
                url: string;
                size: number;
            }[];
            comments: {
                id: string;
                content: string;
                /** Format: date-time */
                createdAt: string;
                user: {
                    name: string | null;
                };
            }[];
        };
        BoardQuarter: {
            id: string;
            /** @description Quarter label, e.g. "2026-Q1" */
            key: string;
            /** Format: date-time */
            startDate: string;
            /** Format: date-time */
            endDate: string;
        };
        BoardMember: {
            id: string;
            /** @description admin, member or viewer */
            role: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
            user: {
                name: string | null;
                email: string;
            };
        };
        PendingInvitation: {
            id: string;
            email: string;
            status: string;
            /** Format: date-time */
            expiresAt: string;
            boardId: string;
            /** Format: date-time */
            createdAt: string;
            /**
             * @description Where the invite was created
             * @enum {string}
             */
            source: "board" | "organization";
            /** @description Set when source is organization */
            organizationId: string | null;
        };
        BoardPeople: {
            owner: {
                name: string | null;
                email: string;
                id: string;
            };
            members: components["schemas"]["BoardMember"][];
            /** @description Only for those who manage the board */
            invitations: components["schemas"]["PendingInvitation"][];
            isOwner: boolean;
            canManage: boolean;
            /** @description The caller's role: owner, admin, member or viewer */
            role: string;
        };
        ExternalAccessToken: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        CreatedExternalAccessToken: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** @description The plaintext token. It is shown this once and cannot be read again. */
            token: string;
        };
        PersonalExternalAccessToken: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            fullAccess: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            board: {
                id: string;
                title: string;
            } | null;
        };
        CreatedPersonalExternalAccessToken: {
            id: string;
            name: string;
            tokenPrefix: string;
            scopes: string[];
            expiresAt: string | null;
            lastUsedAt: string | null;
            /** Format: date-time */
            createdAt: string;
            fullAccess: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            board: {
                id: string;
                title: string;
            } | null;
            /** @description The plaintext token. It is shown this once and cannot be read again. */
            token: string;
        };
        InvitationPreview: {
            /** @description The address the invitation was sent to */
            email: string;
            /**
             * @description Whether this invite is for a board or an organization
             * @enum {string}
             */
            kind: "board" | "organization";
            boardTitle: string | null;
            organizationName: string | null;
            /** @description For organization invites: admin or member */
            role: string | null;
            /** @description pending, accepted or revoked */
            status: string;
            expired: boolean;
        };
        InvitationAccept: {
            boardId?: string;
            organizationId?: string;
        };
        BoardIntegrations: {
            slackWebhookUrl: string | null;
            discordWebhookUrl: string | null;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
        };
        LegalConsentEntry: {
            id: string;
            consentType: string;
            granted: boolean;
            documentVersion: string;
            checkboxText: string;
            source: string;
            ipAddress: string | null;
            userAgent: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        RecordLegalConsentsResponse: {
            recorded: number;
            consents: components["schemas"]["LegalConsentEntry"][];
        };
        ListLegalConsentsResponse: {
            consents: components["schemas"]["LegalConsentEntry"][];
            latestByType: {
                [key: string]: {
                    granted: boolean;
                    documentVersion: string;
                    /** Format: date-time */
                    createdAt: string;
                };
            };
        };
        DsarExportResponse: {
            /** Format: date-time */
            exportedAt: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                createdAt: string | null;
                updatedAt: string | null;
            };
            settings: {
                aiProvider: string;
                aiModel: string | null;
                aiBaseUrl: string | null;
                voiceLanguage: string;
                onboardingDismissedAt: string | null;
                tourSeenAt: string | null;
                appearance: unknown | null;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            } | null;
            mfa: {
                emailEnabled: boolean;
                phoneEnabled: boolean;
                totpEnabled: boolean;
                phone: string | null;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            } | null;
            ownedBoards: {
                id: string;
                title: string;
                description: string | null;
                key: string;
                accessMode: string;
                defaultRole: string;
                organizationId: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            }[];
            boardMemberships: {
                boardId: string;
                role: string;
                /** Format: date-time */
                createdAt: string;
            }[];
            organizationMemberships: {
                organizationId: string;
                role: string;
                /** Format: date-time */
                createdAt: string;
            }[];
            comments: {
                id: string;
                taskId: string;
                content: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
            }[];
            notifications: {
                id: string;
                type: string;
                message: string;
                read: boolean;
                boardId: string | null;
                taskId: string | null;
                /** Format: date-time */
                createdAt: string;
            }[];
            legalConsentLogs: components["schemas"]["LegalConsentEntry"][];
        };
        Notification: {
            id: string;
            /** @description assigned or comment */
            type: string;
            message: string;
            read: boolean;
            userId: string;
            boardId: string | null;
            taskId: string | null;
            /** Format: date-time */
            createdAt: string;
        };
        Organization: {
            id: string;
            name: string;
            description: string | null;
            createdById: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        MyOrganization: {
            id: string;
            name: string;
            description: string | null;
            /** @description The caller's role: owner, admin or member */
            role: string;
            boards: {
                id: string;
                title: string;
                color: string | null;
                /** @description The caller owns the board, so they can move it to another organization */
                canMove: boolean;
                /** @description The caller can create an external access token for the board */
                canIssueToken: boolean;
            }[];
            _count: {
                boards: number;
                members: number;
                teams: number;
            };
        };
        OrganizationMember: {
            role: string;
            /** Format: date-time */
            createdAt: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        };
        Membership: {
            organizationId: string;
            userId: string;
            role: string;
            /** Format: date-time */
            createdAt: string;
        };
        AvailableMember: {
            id: string;
            name: string | null;
            email: string;
            /** @description The organizations the caller shares with them */
            organizations: {
                id: string;
                name: string;
            }[];
        };
        PendingOrganizationInvitation: {
            id: string;
            email: string;
            status: string;
            /** @description admin or member (board-sourced rows use member) */
            role: string;
            /** Format: date-time */
            expiresAt: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /**
             * @description Where the invite was created
             * @enum {string}
             */
            source: "organization" | "board";
            /** @description Set when source is board */
            boardId: string | null;
            /** @description Set when source is board */
            boardTitle: string | null;
        };
        BatchAddMembersResult: {
            added: components["schemas"]["Membership"][];
            failed: {
                email: string;
                error: string;
                message: string;
            }[];
        };
        BatchInviteResult: {
            invited: components["schemas"]["PendingOrganizationInvitation"][];
            failed: {
                email: string;
                error: string;
                message: string;
            }[];
        };
        Team: {
            id: string;
            name: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        TeamDetail: {
            id: string;
            name: string;
            organizationId: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            members: {
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                };
            }[];
            boardAccess: {
                role: string;
                board: {
                    id: string;
                    title: string;
                };
            }[];
        };
        TeamMember: {
            teamId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
        };
        BoardTeamGrant: {
            boardId: string;
            teamId: string;
            role: string;
            /** Format: date-time */
            createdAt: string;
        };
        CalendarTask: {
            id: string;
            title: string;
            completed: boolean;
            dueDate: string | null;
            list: {
                title: string;
                boardId: string;
                board: {
                    id: string;
                    title: string;
                    color: string | null;
                };
            };
        };
        McpConsentOptions: {
            client: string;
            writeRequested: boolean;
            lockedSelection: string | null;
            organizations: {
                id: string;
                name: string;
            }[];
            boards: {
                id: string;
                title: string;
                organizationName: string;
            }[];
        };
        McpOAuthClient: {
            id: string;
            redirectUris: string[];
            allowWrite: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        CreatedMcpOAuthClient: {
            id: string;
            redirectUris: string[];
            allowWrite: boolean;
            /** Format: date-time */
            createdAt: string;
            /** @description Shown once */
            secret: string;
        };
        McpChange: {
            id: string;
            boardId: string;
            kind: string;
            summary: string;
            /** Format: date-time */
            createdAt: string;
            revertedAt: string | null;
            revertsChangeId: string | null;
        };
        McpChangeDetail: {
            id: string;
            kind: string;
            summary: string;
            boardId: string;
            revertedAt: string | null;
            before: unknown[];
            after: unknown[];
            listNames: {
                [key: string]: string;
            };
            userNames: {
                [key: string]: string;
            };
            labelNames: {
                [key: string]: string;
            };
            epicNames: {
                [key: string]: string;
            };
            customFieldNames: {
                [key: string]: string;
            };
        };
        SearchResult: {
            boards: {
                id: string;
                title: string;
                color: string | null;
            }[];
            tasks: {
                id: string;
                title: string;
                completed: boolean;
                list: {
                    title: string;
                    boardId: string;
                    board: {
                        title: string;
                    };
                };
            }[];
        };
        SecuritySettings: {
            email: string;
            emailEnabled: boolean;
            phone: string | null;
            phoneEnabled: boolean;
            totpEnabled: boolean;
        };
        AiSettings: {
            provider: string;
            hasApiKey: boolean;
            /** @description The key with its middle hidden; the key itself is never sent back */
            maskedApiKey: string;
            /** @description Empty means the app's default model */
            model: string;
            baseUrl: string;
            voiceLanguage: string;
        };
        Appearance: {
            mode: string;
            accent: string;
            density: string;
            style: string;
            gradients: boolean;
            card: {
                [key: string]: boolean;
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
