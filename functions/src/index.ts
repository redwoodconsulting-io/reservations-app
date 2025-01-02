import * as logger from "firebase-functions/logger";

import {onDocumentWrittenWithAuthContext} from "firebase-functions/v2/firestore";

import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const modifyDocument =
  onDocumentWrittenWithAuthContext("reservations/{reservationId}",
    (event) => {
      const docId = event.data?.before.id || event.data?.after.id;
      logger.info(`Reservation changed: ${docId}`);

      const previousData = event.data?.before.data();
      const newData = event.data?.after.data();

      // Track the id becoming absent or present to
      // mean the document being deleted or created
      let changeType = "update";
      if (previousData && !newData) {
        changeType = "delete";
      } else if (newData && !previousData) {
        changeType = "create";
      }

      const {authType, authId} = event;
      const who = authType === "system" ? "System" : (authId ? authId : "Unknown");

      const startDate = ((previousData?.startDate || newData?.startDate || "1900") as string);

      db.collection("reservationsAuditLog").doc().create({
        reservationId: docId,
        changeType: changeType,
        before: event.data?.before.data() || {},
        after: event.data?.after.data() || {},
        who: who,
        year: Number((startDate.substring(0, 4))),
        timestamp: new Date(),
      }).then(() => {
        logger.info("Reservation audit log created");
      }).catch((error: any) => {
        logger.error(`Error creating audit log: ${error}`);
      });
    }
  );
