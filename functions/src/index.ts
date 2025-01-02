import * as logger from "firebase-functions/logger";

import {onDocumentWrittenWithAuthContext} from "firebase-functions/v2/firestore";

const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

export const modifyDocument =
  onDocumentWrittenWithAuthContext("reservations/{reservationId}",
    (event) => {
      const docId = event.data?.before.id || event.data?.after.id;
      logger.info(`Reservation changed: ${docId}`);

      const changes: { [key: string]: any } = {};

      // Track the id becoming absent or present to
      // mean the document being deleted or created
      if (event.data?.before.data() && !event.data?.after.data()) {
        changes.id = {before: docId};
      }
      if (event.data?.after.data() && !event.data?.before.data()) {
        changes.id = {after: docId};
      }

      const previousValues = event.data?.before.data() || {};
      const newValues = event.data?.after.data() || {};

      Object.entries(previousValues).forEach(([key, value]) => {
        const newValue = newValues[key];
        if (key !== 'id' && newValue !== value) {
          changes[key] = {
            before: value,
          };
          if (newValue !== undefined) {
            changes[key].after = newValue;
          }
        }
      });
      Object.entries(newValues).forEach(([key, value]) => {
        if (key !== 'id' && previousValues[key] === undefined) {
          changes[key] = {
            after: value,
          };
        }
      });

      const {authType, authId} = event;
      const who = authType === "system" ? "System" : (authId ? authId : "Unknown");

      const startDate = ((newValues.startDate || previousValues.startDate) as string);

      db.collection("reservationsAuditLog").doc().create({
        reservationId: docId,
        changes,
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
