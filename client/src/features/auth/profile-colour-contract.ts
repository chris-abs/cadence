import type { ProfileColour } from "@/components/profile-colours";
import type { components } from "@/lib/api";

type ContractColour = components["schemas"]["ProfileColour"];
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * The shared layer owns its colour list; this fails to compile the moment the
 * list and the contract's `ProfileColour` enum drift apart (either direction),
 * since API colours are passed straight to the shared avatar and picker.
 */
export const coloursMatchContract: Same<ProfileColour, ContractColour> = true;
