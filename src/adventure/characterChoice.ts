import {readSetup} from '../frontSettings.ts';
import {fieldChapter} from './hajjCampaign.ts';
import {readField} from './campaignProgress.ts';
import {decodeDistrict} from './districtModel.ts';
import {loadProgress,QUEST_KEYS,decodeTahallul} from './questProgress.ts';
import {scopedKey} from '../tenant.ts';

/** Old route saves have no avatar field. Inherit a valid choice without rewriting those saves. */
export function adventureAvatar():'male'|'female' {
  return readSetup()?.avatar??readField(fieldChapter('arrival')!)?.avatar??loadProgress(QUEST_KEYS.tahallul,decodeTahallul)?.avatar??loadProgress(scopedKey('manasik-district-v1'),decodeDistrict)?.avatar??'male';
}
