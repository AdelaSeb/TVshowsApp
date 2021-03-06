import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { IShowDetails } from "../ishow-details";
import { IShowDetailsData } from "../ishow-details-data";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { flatMap } from "rxjs/operators";

import { ObserveOnMessage } from "rxjs/internal/operators/observeOn";
import { forkJoin } from "rxjs";
import { of } from "rxjs";
import { ISingleShowDetailsData } from '../isingle-show-details-data';

export interface IShowsService{
  getShowDetails(showName: string):Observable<IShowDetails[]>
}

@Injectable({
  providedIn: "root"
})

export class ShowsService implements IShowsService {
  constructor(private httpClient: HttpClient) {}

  // This function fetches the primary details for a list of show matching the search word
  getShowDetails(showName: string) {
    return this.httpClient.get<IShowDetailsData[]>(`${environment.baseUrl}api.tvmaze.com/search/shows?q=${showName}&appid=${environment.appId}`).pipe(map(data => this.transformToIShowDetails(data)))
    }
      getShowById(showId: string) {
        return this.httpClient
          .get<IShowDetailsData[]>(
            `${
              environment.baseUrl
            }api.tvmaze.com/search/shows/${showId}?&appid=${environment.appId}`
          )
          .pipe(map(data => this.transformToIShowDetails(data)))
  }

  // This function fetches the primary details along with the cast details for a particular show
  getSingleShowDetails(showId: string) {
    return this.httpClient
      .get<ISingleShowDetailsData>(
        `${environment.baseUrl}api.tvmaze.com/shows/${showId}?appId=${
          environment.appId
        }`
      )
      .pipe(map(data => this.transformSingleShowDetails(data))).pipe(
        flatMap((show: any) => {
            if (show != null){ 
              return this.httpClient
              .get(
                `${environment.baseUrl}api.tvmaze.com/shows/${
                  show.showId
                }/cast?appid=${environment.appId}`
              ).pipe(
                map((res: any) => {
                  //let cast: any = res;
                  show = this.transformCastDetails(show, res);
                  return show;
                })
              );
            }
        })
      );
      
  }

  //  This function is used for transforming the data from JSON format(ISingleShowDetailsData) to HTML display format(IShowDetails)
  // These are primary details for a single show.
  private transformSingleShowDetails(data: ISingleShowDetailsData): IShowDetails {

    var genresTemp =""
    var summaryTemp=""

    for (let i=0; i < data.genres.length; i++){
      genresTemp = genresTemp.concat(data.genres[i]);
      if (i < data.genres.length-1){
        genresTemp = genresTemp.concat(", ");
      }

    } 
    if (data.image == null) {
      data.image = { 
        medium: "../assets/popcorn.jpg"}
    }

    if (data.summary != null) {
      summaryTemp = data.summary.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, "");
    }

      var displayData = {
        showId: data.id,
        name: data.name != null ? data.name : "",
        genres: genresTemp,//: data.genres[0] != null ? data.genres[0] : "",
        image: data.image,
        rating: data.rating.average, //!= null ? data.rating.average : ""
        language: data.language != null ? data.language : "",
        summary: summaryTemp,
        cast: null
      }
      console.log("name==",displayData);
      console.log("rating: " + data.rating.average)
      return displayData;
  }

  //  This function is used for transforming the data from JSON format(IShowDetailsData[]) to HTML display format(IShowDetails[])
  // These are details for all shows that match the search criteria.  
  private transformToIShowDetails(data: IShowDetailsData[]): IShowDetails[] {
    
    var displayData = [];
    for (let i = 0; i < data.length; i++) {
      var nameTemp = data[i].show.name != null ? data[i].show.name : "";
      // var genresTemp = data[i].show.genres != null ? data[i].show.genres : "";
      var imageTemp =
        data[i].show.image != null
          ? data[i].show.image.medium
          : "../assets/popcorn.jpg";
      var ratingTemp =
        data[i].show.rating.average != null ? data[i].show.rating.average : "";
      if (ratingTemp === "") {
        ratingTemp = "-";
      }
      // var languageTemp =
      //   data[i].show.language != null ? data[i].show.language : "";
      // var summaryTemp =
      //   data[i].show.summary != null
      //     ? data[i].show.summary.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, "")
      //     : "";

      let newData = {
        showId: data[i].show.id,
        name: nameTemp,
        // genres: genresTemp,
        image: imageTemp,
        rating: ratingTemp,
        // language: languageTemp,
        // summary: summaryTemp
      };
      // console.log(JSON.stringify("medium: "+data[i].show.image.medium))
      // console.log(newData.language);
      displayData.push(newData);
    }
    return displayData;
  }


  
  //  This function is used for transforming the data from JSON format(IShowDetailsData[]) to HTML display format(IShowDetails)
  // These details are for the cast of a show. The cast[] is attached to the corresponding show object.
  private transformCastDetails(
    data: IShowDetails,
    cast: IShowDetailsData[]
  ): IShowDetails {
    var castData = [];
    var castLen = 0;
    if (cast != null) {
      if (cast.length > 4) {
        castLen = 4;
      } else {
        castLen = cast.length;
      }
    }
    for (let i = 0; i < castLen; i++) {
      var nameTemp = cast[i].person.name != null ? cast[i].person.name : "";
      var imageTemp =
        cast[i].person.image != null ? cast[i].person.image.medium : "../assets/avatar.png";

      let newData = {
        name: cast[i].person.name,
        image: imageTemp
      };
      console.log("Cast name: ",newData.name);
      castData.push(newData);
    }
    data.cast = Array.from(castData);
    return data;
  }
}
