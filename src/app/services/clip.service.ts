import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference, QueryDocumentSnapshot, QuerySnapshot
}
  from "@angular/fire/compat/firestore";
import Image from "src/app/models/clip.model";
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {switchMap, map} from 'rxjs/operators';
import {of, BehaviorSubject, combineLatest, lastValueFrom, Observable} from 'rxjs';
import {AngularFireStorage, AngularFireStorageReference} from "@angular/fire/compat/storage";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router} from "@angular/router";
import firebase from "firebase/compat/app";

@Injectable({
  providedIn: 'root'
})
export class ClipService implements Resolve<Image | null> {
  public imageCollection: AngularFirestoreCollection<Image>;
  pageClips: Array<Image> = [];
  pendingReq: boolean = false;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router) {
    this.imageCollection = db.collection('images')
  }

  createImage(data: Image): Promise<DocumentReference<Image>> {
    return this.imageCollection.add(data);
  }

  getUserClips(sort$: BehaviorSubject<string>): Observable<QueryDocumentSnapshot<Image>[]> {
    return combineLatest([
      this.auth.user,
      sort$
    ]).pipe(
      switchMap(values => {
        const [user, sort]: [user: firebase.User | null, sort: string] = values;
        if (!user) {
          return of([])
        }

        const query: firebase.firestore.Query<Image> =
          this.imageCollection.ref.where(
            'uid', '==', user.uid
          ).orderBy('timestamp', sort === '1' ? 'desc' : 'asc');

        return query.get();
      }),
      map(snapshot => (snapshot as QuerySnapshot<Image>).docs)
    )
  }

  updateClip(id: string, title: string): Promise<void>{
    return this.imageCollection.doc(id).update({
      title
    });
  }

  async deleteClip(image: Image): Promise<void> {
    const imageRef: AngularFireStorageReference = this.storage.ref(
      `images/${image.fileName}`
    );

    await imageRef.delete();
    await this.imageCollection.doc(image.docID).delete();
  }

  async getClips(): Promise<void> {
    if (this.pendingReq) {
      return;
    }
    this.pendingReq = true;
    let query: firebase.firestore.Query<Image> =
      this.imageCollection.ref.orderBy('timestamp', 'desc').limit(6);
    const { length }: Image[] = this.pageClips;

    if (length) {
      const lastDocID: string | undefined = this.pageClips[length - 1].docID;
      const clipDoc: Observable<firebase.firestore.DocumentSnapshot<Image>> =
        await this.imageCollection.doc(lastDocID).get();
      const lastDoc: firebase.firestore.DocumentSnapshot<Image> =
        await lastValueFrom(clipDoc);

      query = query.startAfter(lastDoc);
    }
    const snapshot: firebase.firestore.QuerySnapshot<Image> =
      await query.get();

    snapshot.forEach(doc => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data()
      })
    });

    this.pendingReq = false;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Image | null> {
    return this.imageCollection.doc(route.params['id'])
      .get()
      .pipe(
        map(snapshot => {
          const data: Image | undefined = snapshot.data();
          if (!data) {
            this.router.navigate(['/']);
            return null;
          }
          return data;
        })
      )
  }
}
