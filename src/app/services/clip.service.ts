import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference, QueryDocumentSnapshot, QuerySnapshot
}
  from "@angular/fire/compat/firestore";
import IClip from "src/app/models/clip.model";
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {switchMap, map} from 'rxjs/operators';
import {of, BehaviorSubject, combineLatest, lastValueFrom, Observable} from 'rxjs';
import {AngularFireStorage, AngularFireStorageReference} from "@angular/fire/compat/storage";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router} from "@angular/router";
import firebase from "firebase/compat/app";

@Injectable({
  providedIn: 'root'
})
export class ClipService implements Resolve<IClip | null> {
  public clipsCollection: AngularFirestoreCollection<IClip>;
  pageClips: Array<IClip> = [];
  pendingReq: boolean = false;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router) {
    this.clipsCollection = db.collection('clips')
  }

  createClip(data: IClip): Promise<DocumentReference<IClip>> {
    return this.clipsCollection.add(data);
  }

  getUserClips(sort$: BehaviorSubject<string>): Observable<QueryDocumentSnapshot<IClip>[]> {
    return combineLatest([
      this.auth.user,
      sort$
    ]).pipe(
      switchMap(values => {
        const [user, sort]: [user: firebase.User | null, sort: string] = values;
        if (!user) {
          return of([])
        }

        const query: firebase.firestore.Query<IClip> =
          this.clipsCollection.ref.where(
            'uid', '==', user.uid
          ).orderBy('timestamp', sort === '1' ? 'desc' : 'asc');

        return query.get();
      }),
      map(snapshot => (snapshot as QuerySnapshot<IClip>).docs)
    )
  }

  updateClip(id: string, title: string): Promise<void>{
    return this.clipsCollection.doc(id).update({
      title
    });
  }

  async deleteClip(clip: IClip): Promise<void> {
    const clipRef: AngularFireStorageReference = this.storage.ref(`clips/${clip.fileName}`);
    const screenshotRef: AngularFireStorageReference = this.storage.ref(
      `screenshots/${clip.screenshotFileName}`
    );

    await clipRef.delete();
    await screenshotRef.delete();
    await this.clipsCollection.doc(clip.docID).delete();
  }

  async getClips(): Promise<void> {
    if (this.pendingReq) {
      return;
    }
    this.pendingReq = true;
    let query: firebase.firestore.Query<IClip> =
      this.clipsCollection.ref.orderBy('timestamp', 'desc').limit(6);
    const { length }: IClip[] = this.pageClips;

    if (length) {
      const lastDocID: string | undefined = this.pageClips[length - 1].docID;
      const clipDoc: Observable<firebase.firestore.DocumentSnapshot<IClip>> =
        await this.clipsCollection.doc(lastDocID).get();
      const lastDoc: firebase.firestore.DocumentSnapshot<IClip> =
        await lastValueFrom(clipDoc);

      query = query.startAfter(lastDoc);
    }
    const snapshot: firebase.firestore.QuerySnapshot<IClip> =
      await query.get();

    snapshot.forEach(doc => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data()
      })
    });

    this.pendingReq = false;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IClip | null> {
    return this.clipsCollection.doc(route.params['id'])
      .get()
      .pipe(
        map(snapshot => {
          const data: IClip | undefined = snapshot.data();
          if (!data) {
            this.router.navigate(['/']);
            return null;
          }
          return data;
        })
      )
  }
}
