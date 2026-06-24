import { createContext } from "react";

// Broadcasts the global furigana toggle to every <Ruby> without prop
// drilling. Default OFF so a <Ruby> rendered with no provider (and the
// realistic exam condition) shows plain text. App supplies the live value
// from useFurigana.
//
// Deliberately split from Ruby.tsx: App (eager) only needs the context to
// provide it, while Ruby pulls in the (potentially large) pre-baked
// furiganaData table. Keeping the context here lets App stay clean and the
// data ride only in the lazy challenge chunk that actually renders <Ruby>
// (see [[jabiko-bundle-codesplit]]).
export const FuriganaContext = createContext<{ enabled: boolean }>({ enabled: false });
