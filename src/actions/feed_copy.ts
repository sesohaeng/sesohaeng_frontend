import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { FeedInfo } from "../@types/FeedInfo";
import { RootReducer } from "../store";
import { sleep } from "../utils/utils";
import axios from "axios";
import { Config } from "../config";
import FormData from 'form-data';
import { RequestPostCreate } from "../@types/RequestPostCreate";
import dayjs, { Dayjs } from 'dayjs';
import duration, { Duration } from 'dayjs/plugin/duration';
import { getMyFavoriteListSuccess } from "./user";
dayjs.extend(duration);

// 경과 시간 계산 함수
export function getTimeDiff(timeToCompare: Dayjs): string {
    const timeDiffDuration: Duration = dayjs.duration(dayjs().diff(timeToCompare))
    const yearDiff: number = parseInt(timeDiffDuration.format('Y'))
    const monthDiff: number = parseInt(timeDiffDuration.format('M'))
    const dateDiff: number = parseInt(timeDiffDuration.format('D'))
    const hourDiff: number = parseInt(timeDiffDuration.format('H'))
    const minuteDiff: number = parseInt(timeDiffDuration.format('m'))
    const secondDiff: number = parseInt(timeDiffDuration.format('s'))
  
    if (yearDiff > 0) {
      return `${yearDiff}년 전`
    } else if (monthDiff > 0) {
      return `${monthDiff}달 전`
    } else if (dateDiff > 0) {
      return `${dateDiff}일 전`
    } else if (hourDiff > 0) {
      return `${hourDiff}시간 전`
    } else if (minuteDiff > 0) {
      return `${minuteDiff}분 전`
    } else if (secondDiff > 0) {
      return `${secondDiff}초 전`
    } else {
      return ''
    }
}

export const GET_FEED_LIST_REQUEST = 'GET_FEED_LIST_REQUEST' as const;
export const GET_FEED_LIST_SUCCESS = 'GET_FEED_LIST_SUCCESS' as const;
export const GET_FEED_LIST_FAILURE = 'GET_FEED_LIST_FAILURE' as const;

export const CREATE_FEED_REQUEST = 'CREATE_FEED_REQUEST' as const;
export const CREATE_FEED_SUCCESS = 'CREATE_FEED_SUCCESS' as const;
export const CREATE_FEED_FAILURE = 'CREATE_FEED_FAILURE' as const;


export const FAVORITE_FEED_REQUEST = 'FAVORITE_FEED_REQUEST' as const;
export const FAVORITE_FEED_SUCCESS = 'FAVORITE_FEED_SUCCESS' as const;
export const FAVORITE_FEED_FAILURE = 'FAVORITE_FEED_FAILURE' as const;

export const DELETE_FAVORITE_FEED_REQUEST = 'DELETE_FAVORITE_FEED_REQUEST' as const;
export const DELETE_FAVORITE_FEED_SUCCESS = 'DELETE_FAVORITE_FEED_SUCCESS' as const;
export const DELETE_FAVORITE_FEED_FAILURE = 'DELETE_FAVORITE_FEED_FAILURE' as const;

export const getFeedListRequest = ()=>{
    return {
        type:GET_FEED_LIST_REQUEST,
    }
}
export const getFeedListSuccess = (list:FeedInfo[])=>{

    return {
        type:GET_FEED_LIST_SUCCESS,
        list
    }
}

export const getFeedListFailure = ()=>{
    return {
        type:GET_FEED_LIST_FAILURE
    }
}

export const createFeedRequest = ()=>{
    return {
        type: CREATE_FEED_REQUEST,
    }
}

export const createFeedSuccess = (item:FeedInfo)=>{
    return {
        type:CREATE_FEED_SUCCESS,
        item:item
    }
}

export const createFeedFailure = ()=>{
    return {
        type: CREATE_FEED_FAILURE
    }
}

export const favoriteFeedRequest = ()=>{
    return {
        type:FAVORITE_FEED_REQUEST
    }
}
export const favoriteFeedSuccess = (feedId:FeedInfo['id'])=>{
    return {
        type:FAVORITE_FEED_SUCCESS,
        feedId,
    }
}

export const favoriteFeedFailure = ()=>{
    return {
        type:DELETE_FAVORITE_FEED_FAILURE
    }
}
export const deleteFavoriteFeedRequest = ()=>{
    return {
        type:DELETE_FAVORITE_FEED_REQUEST
    }
}
export const deleteFavoriteFeedSuccess = (feedId:FeedInfo['id'])=>{
    return {
        type:DELETE_FAVORITE_FEED_SUCCESS,
        feedId,
    }
}

export const deleteFavoriteFeedFailure = ()=>{
    return {
        type:DELETE_FAVORITE_FEED_FAILURE
    }
}

export const getFeedList = ():FeedListThunkAction=> async (dispatch)=>{
    dispatch(getFeedListRequest());
    axios.interceptors.request.clear();
    axios.get(`${Config.server}/posts`).then(async(res) => {
        // console.log(res.data.data.feeds);
        // TODO: 피드 좋아요 상태 조회 추가 => 백엔드로부터 받을 예정.
        const feedList:FeedInfo[] = res.data.data.feeds;
        // const feedListNew = feedList.map((f) => {
        //     try {
        //         const response = axios.get(`${Config.server}/posts/${f.id}/heart`).then(liked => {return liked.data.data})
        //         // console.log(response.data)
        //         return {
        //             ...f,
        //             isLiked : response.data.data
        //         }

        //     } catch (err) {
        //         console.log(err)
        //         return f
        //     }
        // });
        const feedListNew = feedList.map(item => {return {...item, isLiked:true, updatedAt: getTimeDiff(dayjs(item.updatedAt.replace('T', ' ')))}});
        dispatch(
            getFeedListSuccess(feedListNew))    
    }).catch(err => {console.log(err.response)});
    
}


export const createFeed = (item:Omit<FeedInfo, 'id'|'heartCount'|'userName'|'updatedAt'|'profileImage'|'isLiked'>):FeedListThunkAction => async (dispatch, getState)=>{
    dispatch(createFeedRequest());
    // axios 로그 확인용
    axios.interceptors.request.clear(); 
    axios.interceptors.request.use(request => {
        console.log('Starting Request', JSON.stringify(request, null, 2))
        return request
      });
    // post formdata 
    const formData = new FormData();
    const variables = {
        content: item.content,
        placeName: item.placeName 
      }
    // content
    formData.append('feedCreateRequest',JSON.stringify(variables));
    // , {type: "application/json"}));
    // formData.append('feedCreateRequest', new Blob([JSON.stringify({"content":item.content})], {type: "application/json"}));
    // formData.append('feedCreateRequest', new Blob([JSON.stringify({"placName":item.placeName})], {type: "application/json"}));
    // formData.append('content', item.content);
    // formData.append('placeName', item.placeName);
    // 이미지 전처리
    const filename = item.imageUrl.split('/').pop();
    const match = /\.(\w+)$/.exec(filename ?? '');
    const type = match ? `image/${match[1]}` : 'image';
    
    formData.append('image', {uri: item.imageUrl, name: filename, type});
    // Post 
    await axios.post(`${Config.server}/posts`,formData ,{ 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'}
        ,
        transformRequest: formData => formData,
    })
    .then(res => console.log(res))
    .catch(err => {console.log(err)});
}

export const favoriteFeed = (feedId:number):FeedListThunkAction => async (dispatch, getState)=>{
    dispatch(favoriteFeedRequest());
    dispatch(favoriteFeedSuccess(feedId))
    const selectedFeed = getState().feedList.list.filter(item => item.id === feedId);
    const favoriteFeed = getState().userInfo.myFavoriteList.concat(selectedFeed);
}

export const deleteFavoriteFeed = (feedId:number):FeedListThunkAction => async (dispatch)=>{
    dispatch(deleteFavoriteFeedRequest());

    dispatch(deleteFavoriteFeedSuccess(feedId));
}



export type FeedListThunkAction = ThunkAction<void, RootReducer, undefined, FeedListActions>;
export type TypeFeedListDispatch = ThunkDispatch<RootReducer, undefined, FeedListActions>;
export type FeedListActions = 
    | ReturnType<typeof getFeedListSuccess> 
    | ReturnType<typeof getFeedListRequest>
    | ReturnType<typeof getFeedListFailure>
    | ReturnType<typeof createFeedRequest>
    | ReturnType<typeof createFeedSuccess>
    | ReturnType<typeof createFeedFailure>
    | ReturnType<typeof favoriteFeedRequest>
    | ReturnType<typeof favoriteFeedSuccess>
    | ReturnType<typeof favoriteFeedFailure>
    | ReturnType<typeof deleteFavoriteFeedRequest>
    | ReturnType<typeof deleteFavoriteFeedSuccess>
    | ReturnType<typeof deleteFavoriteFeedFailure>;