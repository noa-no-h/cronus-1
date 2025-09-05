import { IActiveWindowEvent } from '../models/activeWindowEvent';
import { CanonicalBlockModel, ICanonicalBlock } from '../models/canonicalBlock';

// Time in seconds to consider two blocks contiguous
const MERGE_THRESHOLD_SECONDS = 15;

class CanonicalBlockService {
  // The event here should be a Mongoose document, which has properties like _id
  public async upsertFromEvent(event: IActiveWindowEvent & { _id: any }): Promise<ICanonicalBlock> {
    const lastBlock = await CanonicalBlockModel.findOne({
      userId: event.userId,
    }).sort({ endTime: -1 });

    // The schema defines timestamp as a Number (Date.now()), so we create a Date object from it
    const eventTimestamp = new Date(event.timestamp);
    const merge = this.shouldMerge(lastBlock, event, eventTimestamp);
    // console.log('Merging blocks:', merge , 'Last Block:', lastBlock?.windowTitle, 'Event:', event.title);
    console.log('Last Block:', lastBlock?.windowTitle);
    console.log('Last Block appName:', lastBlock?.appName, 'event ownerName:', event.ownerName);
    console.log('Event:', event.title);
    console.log('Merge:', merge);
    if (lastBlock && merge) {
      // Merge with the previous block
      lastBlock.endTime = eventTimestamp;
      lastBlock.duration = (lastBlock.endTime.getTime() - lastBlock.startTime.getTime()) / 1000;
      if (event._id) {
        lastBlock.sourceEventIds.push(event._id.toString());
      }
      await lastBlock.save();
      return lastBlock;
    } else {
      // Create a new block
      const newBlock = await CanonicalBlockModel.create({
        userId: event.userId,
        startTime: eventTimestamp,
        endTime: eventTimestamp, // Initially, start and end are the same
        duration: 0,
        appName: event.ownerName, // Use ownerName for appName
        windowTitle: event.title || '', // Use title for windowTitle, provide default
        activityType: 'neutral', // Logic to determine this can be added later
        sourceEventIds: event._id ? [event._id.toString()] : [],
      });
      return newBlock;
    }
  }

  private shouldMerge(lastBlock: ICanonicalBlock | null, event: IActiveWindowEvent, eventTimestamp: Date): boolean {
    if (!lastBlock) {
      return false;
    }

    const timeDiffSeconds = (eventTimestamp.getTime() - lastBlock.endTime.getTime()) / 1000;

    return (
      lastBlock.appName === event.ownerName &&
      lastBlock.windowTitle === event.title &&
      timeDiffSeconds > 0 &&
      timeDiffSeconds <= MERGE_THRESHOLD_SECONDS
    );
  }
}

export const canonicalBlockService = new CanonicalBlockService();