// SAMPLE — "The Athens 101" bucket list in the Passport.
// Grouped the way UGA Housing's "101 Things to Do in Athens" list is, as a
// co-branding pitch to Housing / Student Affairs. These are a starter set of our
// own picks, not that list's text. Items tied to a place tick off on check-in;
// the rest are ticked by hand.

export type BucketGroup = 'UGA Traditions' | 'Classic City' | 'Outdoors' | 'Arts' | 'Selfie Spots' | 'Down the Road';

export type BucketItem = {
  id: string;
  group: BucketGroup;
  text: string;
  /** Checking in here completes the item. */
  placeId?: string;
};

export const BUCKET_GROUPS: BucketGroup[] = ['UGA Traditions', 'Classic City', 'Outdoors', 'Arts', 'Selfie Spots', 'Down the Road'];

export const ATHENS_101: BucketItem[] = [
  { id: 'arch-photo', group: 'UGA Traditions', text: 'Photo at the Arch (walking under it waits until graduation)', placeId: 'the-arch' },
  { id: 'cannon', group: 'UGA Traditions', text: 'Find the Double-Barreled Cannon', placeId: 'double-barreled-cannon' },
  { id: 'chapel-bell', group: 'UGA Traditions', text: 'Ring the Chapel bell after a Dawgs win' },
  { id: 'sanford', group: 'UGA Traditions', text: 'Be in Sanford for a home game (or a watch party)' },

  { id: 'tree', group: 'Classic City', text: 'Visit the Tree That Owns Itself', placeId: 'tree-owns-itself' },
  { id: 'wuxtry', group: 'Classic City', text: 'Dig through the bins at Wuxtry', placeId: 'wuxtry' },
  { id: 'waffle', group: 'Classic City', text: 'A 2am plate at the Waffle House on Broad', placeId: 'waffle-house' },
  { id: 'show', group: 'Classic City', text: 'See a local band downtown' },

  { id: 'herrick', group: 'Outdoors', text: 'Walk the loop at Lake Herrick', placeId: 'lake-herrick' },
  { id: 'firefly', group: 'Outdoors', text: 'Ride the Firefly Trail', placeId: 'firefly-trail' },
  { id: 'sandy-creek', group: 'Outdoors', text: 'Spend a morning at Sandy Creek Park', placeId: 'sandy-creek-park' },

  { id: 'gmoa', group: 'Arts', text: 'Wander the Georgia Museum of Art', placeId: 'gmoa' },
  { id: 'lyndon', group: 'Arts', text: 'Catch an opening at Lyndon House', placeId: 'lyndon-house' },
  { id: 'lamar', group: 'Arts', text: 'See student work at the Lamar Dodd galleries', placeId: 'lamar-dodd' },

  { id: 'herty', group: 'Selfie Spots', text: 'Herty Field fountain', placeId: 'herty-field' },
  { id: 'garden', group: 'Selfie Spots', text: 'The State Botanical Garden', placeId: 'botanical-garden' },
  { id: 'trophies', group: 'Selfie Spots', text: 'The trophies at Butts-Mehre', placeId: 'butts-mehre' },

  { id: 'watson-mill', group: 'Down the Road', text: 'Covered bridge day trip to Watson Mill Bridge State Park' },
  { id: 'apples', group: 'Down the Road', text: 'Fall apple picking in the North Georgia mountains' },
];
