#!/bin/bash

function getSizeList {

for cluster in `ls -d */$size/*`; do
 echo $cluster;
done

}

function getSSList {
 
list=$( eval getSizeList );
for compCluster in $list; do
 if [[ "$compCluster" == "$calcDir" ]]; then continue; fi;
  
  thisContcar=$calcDir/CONTCAR
  otherContcar=$compCluster/CONTCAR;
  if [ ! -s $otherContcar ]; then continue; fi
  score=$( java -jar ../compare.jar $thisContcar $otherContcar );
  if (( $( echo "$score < 0.8" | bc -l ) )); then
   echo "$compCluster $score" >> $calcDir/similarity.log;
  else
   continue; 
  fi
done

}

function getSimilarStructures {
 
 eval getSSList;
 if [ ! -e $calcDir/similarity.log ]; then return; fi;
 echo $( cat $calcDir/similarity.log | sort -n -k2 | head -10 | cut -d ' ' -f1 );
 rm $calcDir/similarity.log

}

function searchLowestEnergy {

 if [ ! -e $dir ]; then echo null; return; fi
 lowestEnergy=0;
 lowestOutcar="";
 for searchDir in `ls -d $dir/*`; do
  out="$searchDir/OUTCAR"
  energy=$( grep "energy  without" $out 2> /dev/null | tail -n1 | tr -s ' ' | cut -d ' ' -f8 );
  if (( $( echo "$energy < $lowestEnergy" | bc -l ) )); then
   lowestEnergy=$energy;
   lowestOutcar="$searchDir/OUTCAR";
  fi
 done

 echo $lowestOutcar
 
}

function getNPlus1Formation {
 
 nplusone=$(( $size+1 ));
 dir="$element/$nplusone";
 #echo $dir
 nplusOneOutcar=$( eval searchLowestEnergy );
 if [ ! -e $nplusOneOutcar ]; then echo ""; return; fi
 nOutcar="$calcDir/OUTCAR";
 nPlusOneE=$( grep "energy  without" $nplusOneOutcar 2> /dev/null | tail -n1 | tr -s ' ' | cut -d ' ' -f8 );
 nE=$( grep "energy  without" $nOutcar 2> /dev/null | tail -n1 | tr -s ' ' | cut -d ' ' -f8 );
 diff=$( echo "$nE - $nPlusOneE" | bc -l );
 echo $diff; 

}

function getNMinus1Formation {

 nminusone=$(( $size-1 ));
 dir="$element/$nminusone";
 #echo $dir
 nminusOneOutcar=$( eval searchLowestEnergy );
 nOutcar="$calcDir/OUTCAR";
 if [ ! -e $nminusOneOutcar ]; then echo ""; return; fi
 nMinusOneE=$( grep "energy  without" $nminusOneOutcar 2> /dev/null | tail -n1 | tr -s ' ' | cut -d ' ' -f8 );
 nE=$( grep "energy  without" $nOutcar 2> /dev/null | tail -n1 | tr -s ' ' | cut -d ' ' -f8 );
 diff=$( echo "$nE - $nMinusOneE" | bc -l );
 echo $diff;

}

cd infoTxtSubset;

for calcDir in `ls -d */*/*`; do

 echo $calcDir
 element=$( echo $calcDir | cut -d '/' -f1 );
 size=$( echo $calcDir | cut -d '/' -f2 );
 structurenum=$( echo $calcDir | cut -d '/' -f3 );
 gap=$( ../gap.sh $calcDir/OUTCAR );
 similarStructuresTop10=$( eval getSimilarStructures );
 #echo "nplus1"
 nplus1=$( eval getNPlus1Formation ); 
 #echo "nminus1"
 nminus1=$( eval getNMinus1Formation );
 nelect=`awk '/NELECT/ {print $3/1}' $calcDir/OUTCAR`
# echo "$nminus1 \n$nplus1 \n$gap \n$nelect "
 
 echo -e "Formation energy (N-1 -> N): $nminus1 eV\nFormation energy (N+1 -> N): $nplus1 eV\nHOMO-LUMO gap: $gap eV\nNumber of valence electrons: $nelect electrons\nSimilar structure(s): $similarStructuresTop10" > ../infotests/infotest-$element-$size-$structurenum.txt
done
cd $OLDPWD;

