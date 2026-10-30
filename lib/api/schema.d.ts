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
        post?: never;
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
        /** What an invitation link is for: the address, the board and whether it can still be used */
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
        /** Accept an invitation: joins the board and its organization */
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
                        "application/json": {
                            boardId: string;
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
        ActivityLogInput: {
            id: string;
            type: string;
            /** @description JSON {"k": translation key, "p": params}; the frontend translates it */
            message: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
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
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
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
        InvitationPreviewInput: {
            /** @description The address the invitation was sent to */
            email: string;
            boardTitle: string;
            /** @description pending, accepted or revoked */
            status: string;
            expired: boolean;
        };
        BoardIntegrationsInput: {
            slackWebhookUrl: string | null;
            discordWebhookUrl: string | null;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
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
        ActivityLog: {
            id: string;
            type: string;
            /** @description JSON {"k": translation key, "p": params}; the frontend translates it */
            message: string;
            boardId: string;
            userId: string;
            /** Format: date-time */
            createdAt: string;
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
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
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
        InvitationPreview: {
            /** @description The address the invitation was sent to */
            email: string;
            boardTitle: string;
            /** @description pending, accepted or revoked */
            status: string;
            expired: boolean;
        };
        BoardIntegrations: {
            slackWebhookUrl: string | null;
            discordWebhookUrl: string | null;
            notifyOnTaskCreated: boolean;
            notifyOnTaskCompleted: boolean;
            notifyOnTaskMoved: boolean;
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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
