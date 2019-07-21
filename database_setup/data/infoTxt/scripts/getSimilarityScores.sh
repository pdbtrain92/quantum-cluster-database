#!/bin/bash

lit=$WORKDIR/makeInfoTxt/infoTxtSubset-lit

for qcdCalc in `ls -d infoTxtSubset/*/*/*`; do
 
 element=$( echo $qcdCalc | cut -d '/' -f2 );
 size=$( echo $qcdCalc | cut -d '/' -f3 );
 structureNum=$( echo $qcdCalc | cut -d '/' -f4 );
 litPoscar="infoTxtSubset-dft/$element/$size/1/CONTCAR";
 qcdPoscar="$qcdCalc/CONTCAR";

 echo $litPoscar $qcdPoscar
 
 score=$( java -jar compare.jar $litPoscar $qcdPoscar );

 echo "$element $size $structureNum $score" 

done

